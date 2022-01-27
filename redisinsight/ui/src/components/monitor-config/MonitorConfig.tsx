import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { debounce } from 'lodash'
import { io } from 'socket.io-client'

import {
  setSocket,
  monitorSelector,
  toggleRunMonitor,
  concatMonitorItems,
  stopMonitor,
} from 'uiSrc/slices/cli/monitor'
import { getBaseApiUrl } from 'uiSrc/utils'
import { MonitorEvent, SocketEvent } from 'uiSrc/constants'
import { IMonitorDataPayload } from 'uiSrc/slices/interfaces'
import { connectedInstanceSelector } from 'uiSrc/slices/instances'
import { IOnDatePayload } from 'apiSrc/modules/monitor/helpers/client-monitor-observer'

const MonitorConfig = () => {
  const { id: instanceId = '' } = useSelector(connectedInstanceSelector)
  const { socket, isRunning, isMinimizedMonitor, isShowMonitor } = useSelector(monitorSelector)

  const dispatch = useDispatch()

  const setNewItems = debounce((items, onSuccess?) => {
    dispatch(concatMonitorItems(items))
    onSuccess?.()
  }, 100, {
    maxWait: 1000,
  })

  useEffect(() => {
    if (!isRunning || !instanceId || socket?.connected) {
      return
    }
    let retryTimer: NodeJS.Timer

    // Create SocketIO connection to instance by instanceId
    const newSocket = io(`${getBaseApiUrl()}/monitor`, {
      forceNew: true,
      query: { instanceId },
    })
    dispatch(setSocket(newSocket))
    const payloads: IMonitorDataPayload[] = []

    const handleMonitorEvents = () => {
      newSocket.on(MonitorEvent.MonitorData, (payload:IOnDatePayload) => {
        payloads.push(payload)

        // set batch of payloads and then clear batch
        setNewItems(payloads, () => {
          payloads.length = 0
          // reset all timings after items were changed
          setNewItems.cancel()
        })
      })
    }

    newSocket.on('connect', () => {
      // Trigger Monitor event
      clearTimeout(retryTimer)
      newSocket.emit(MonitorEvent.Monitor, handleMonitorEvents)
    })

    // Catch exceptions
    newSocket.on(MonitorEvent.Exception, (payload) => {
      payloads.push({ isError: true, time: `${Date.now()}`, ...payload })
      setNewItems(payloads, () => { payloads.length = 0 })
      dispatch(toggleRunMonitor())
    })

    // Catch disconnect
    newSocket.on(SocketEvent.Disconnect, (a) => {
      console.log('Disconnect', JSON.stringify(a))
      retryTimer = setTimeout(() => {
        newSocket.removeAllListeners()
        dispatch(stopMonitor())
      }, 10000)
    })

    // Catch connect error
    newSocket.on(SocketEvent.ConnectionError, (error: Error) => {
      payloads.push({ isError: true, time: `${Date.now()}`, message: `${error?.name}: ${error?.message}` })
      setNewItems(payloads, () => { payloads.length = 0 })
      dispatch(toggleRunMonitor())
    })
  }, [instanceId, isRunning])

  useEffect(() => {
    if (!isRunning) {
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [socket, isRunning, isShowMonitor, isMinimizedMonitor])

  return null
}

export default MonitorConfig
