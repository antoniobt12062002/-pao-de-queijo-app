import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotificationButton from './NotificationButton'

vi.mock('../lib/firebase', () => ({
  getFirebaseMessaging: vi.fn().mockReturnValue({}),
  getToken: vi.fn(),
  VAPID_KEY: 'key',
}))
vi.mock('../api/devices', () => ({ registerDevice: vi.fn() }))

describe('NotificationButton', () => {
  beforeEach(() => {
    // Reset navigator properties
    Object.defineProperty(navigator, 'standalone', { value: false, configurable: true })
    Object.defineProperty(navigator, 'userAgent', { value: 'Chrome', configurable: true })
    // Mock Notification API
    global.Notification = {
      permission: 'default' as NotificationPermission,
      requestPermission: vi.fn(),
    } as any
  })

  it('mostra instrução de instalação no iOS fora do modo standalone', () => {
    Object.defineProperty(navigator, 'standalone', { value: false, configurable: true })
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    })
    render(<NotificationButton />)
    expect(screen.getByText(/adicione à tela inicial/i)).toBeInTheDocument()
  })

  it('mostra botão ativar quando permissão não foi concedida', () => {
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true })
    Object.defineProperty(navigator, 'userAgent', { value: 'Chrome', configurable: true })
    global.Notification.permission = 'default' as NotificationPermission
    render(<NotificationButton />)
    expect(screen.getByRole('button', { name: /ativar notificações/i })).toBeInTheDocument()
  })

  it('mostra mensagem de ativo quando permissão já foi concedida', () => {
    global.Notification.permission = 'granted' as NotificationPermission
    render(<NotificationButton />)
    expect(screen.getByText(/notificações ativas/i)).toBeInTheDocument()
  })

  it('mostra mensagem de bloqueio quando permissão foi negada', () => {
    Object.defineProperty(Notification, 'permission', { value: 'denied', configurable: true })
    Object.defineProperty(navigator, 'userAgent', { value: 'Chrome', configurable: true })
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true })
    render(<NotificationButton />)
    expect(screen.getByText(/bloqueadas/i)).toBeInTheDocument()
  })
})
