import { FC } from 'react'
import { FaCircle, FaExclamationTriangle } from 'react-icons/fa'
import { IConnection } from 'types/Connection'

interface IProps {
  connection: IConnection
}

export const ConnectionBadge: FC<IProps> = ({ connection: { enabled, state } }) => {
  if (!enabled) {
    return (
      <div className="flex flex-row px-2 py-1 text-xs font-medium leading-none rounded-full text-gray-500 bg-gray-100">
        <span className="flex flex-col justify-center mr-2">
          <FaCircle size={8} />
        </span>
        Disabled
      </div>
    )
  }

  return state === 'callable' ? (
    <div className="flex flex-row px-2 py-1 text-xs font-medium leading-none rounded-full text-primary-600 bg-primary-100">
      <span className="flex flex-col justify-center mr-2">
        <FaCircle size={8} />
      </span>
      Enabled
    </div>
  ) : (
    <div className="flex flex-row px-2 py-1 text-xs font-medium leading-none rounded-full bg-warning-lighter text-warning">
      <span className="mr-2">
        <FaExclamationTriangle />
      </span>
      Needs configuration
    </div>
  )
}
