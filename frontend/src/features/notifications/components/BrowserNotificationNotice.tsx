import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import './BrowserNotificationNotice.css'

type BrowserPermission = NotificationPermission | 'unsupported'

function currentPermission(): BrowserPermission {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

const permissionInfo: Record<BrowserPermission, { title: string; description: string }> = {
  default: { title: '브라우저 알림 권한이 허용되지 않았어요.', description: '권한을 허용하지 않아도 앱 내 알림은 확인할 수 있습니다. 브라우저의 사이트 설정에서 알림 권한을 확인할 수 있습니다.' },
  denied: { title: '브라우저 알림이 차단되어 있어요.', description: '앱 내 알림에서 내용을 확인해 주세요. 권한을 변경하려면 브라우저의 사이트 설정에서 이 주소의 알림 권한을 확인해 주세요.' },
  granted: { title: '이 브라우저의 알림 권한이 허용되어 있어요.', description: '권한 허용과 실제 발송은 별개입니다. 현재 화면에서는 알림을 예약하거나 발송하지 않습니다.' },
  unsupported: { title: '이 환경은 브라우저 알림을 지원하지 않아요.', description: '앱 내 알림에서 마감과 변경 내용을 확인할 수 있습니다. 브라우저 알림을 사용할 수 없어도 목록은 이용할 수 있습니다.' },
}

export function BrowserNotificationNotice() {
  const [permission, setPermission] = useState(currentPermission)
  const info = permissionInfo[permission]
  return (
    <section className="browser-notification-notice" aria-label="브라우저 알림 상태">
      <Icon name="bell" size={18} />
      <div><p role="status">{info.title}</p><details><summary>브라우저 알림 안내</summary><p>{info.description}</p><p>현재는 알림 화면 미리보기입니다. 이 화면에서 권한을 요청하거나 실제 알림을 발송하지 않습니다.</p></details></div>
      <button type="button" className="button secondary" onClick={() => setPermission(currentPermission())}>상태 새로 확인</button>
    </section>
  )
}
