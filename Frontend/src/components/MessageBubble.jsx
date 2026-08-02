import { Bot, User } from 'lucide-react'
import MessageActions from './MessageActions'
import StructuredResponse from './StructuredResponse'

export default function MessageBubble({ message, onBookmark }) {
  const isUser = message.role === 'user'

  return (
    <div className={['flex', isUser ? 'justify-end' : 'justify-start'].join(' ')}>
      <div className={['flex max-w-[90%] items-end gap-3 sm:max-w-[78%]', isUser ? 'flex-row-reverse' : ''].join(' ')}>
        <div
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            isUser ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-200',
          ].join(' ')}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        <div className="w-full">
          <div
            className={[
              'rounded-2xl text-sm leading-6 shadow-sm',
              isUser
                ? 'rounded-br-md bg-blue-600 px-4 py-3 text-white'
                : 'rounded-bl-md border border-slate-200 bg-white text-slate-700',
            ].join(' ')}
          >
            {isUser ? (
              <span className="whitespace-pre-wrap">{message.text}</span>
            ) : (
              <StructuredResponse text={message.text} />
            )}
          </div>

          {!isUser && <MessageActions message={message} onBookmark={onBookmark} />}
        </div>
      </div>
    </div>
  )
}