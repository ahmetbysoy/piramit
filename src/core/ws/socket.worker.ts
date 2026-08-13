/** Worker: soket burada, UI thread boş kalır. */

import { SocketRuntime } from './socketRuntime'

const rt = new SocketRuntime()

rt.setHandlers({
  onStatus: (s) => {
    postMessage({ t: 'status', s, err: rt.lastError })
  },
  onError: () => {
    postMessage({ t: 'err', err: rt.lastError })
  },
  onMessage: (raw) => {
    postMessage({ t: 'msg', raw })
  },
})

onmessage = (e: MessageEvent<{ t: 'connect' | 'disconnect'; url?: string }>) => {
  if (e.data.t === 'connect' && e.data.url) rt.connect(e.data.url)
  if (e.data.t === 'disconnect') rt.disconnect()
}
