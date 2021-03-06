import { ErrorBlock, ResourceForm } from 'components'
import React, { useEffect, useState } from 'react'

import { IConnection } from 'types/Connection'
import { JWTSession } from 'types/JWTSession'
import { applySession } from 'next-session'
import client from 'lib/axios'
import { options } from 'utils/sessionOptions'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { useToast } from '@apideck/components'

interface IProps {
  connection: IConnection
  jwt: string
  token: JWTSession
  url: string
  resource: string
}

const Resource = ({ jwt, token, url, resource }: IProps) => {
  const [connection, setConnection] = useState<IConnection>()
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<{ status: number; data?: any } | null>(null)
  const { addToast } = useToast()
  const { back } = useRouter()

  const fetcher = (url: string) => {
    return client.get(url, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'X-APIDECK-APP-ID': token?.applicationId,
        'X-APIDECK-CONSUMER-ID': token?.consumerId
      }
    })
  }

  const { data, error: connectionError } = useSWR(url, fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false
  })

  useEffect(() => {
    if (data) {
      setConnection(data.data.data)
      setLoading(false)
    }
  }, [data])

  useEffect(() => {
    if (connectionError) {
      const { response } = connectionError
      const errorObj = response ? response : { status: 400 }
      if (errorObj.data && !error) {
        addToast({
          title: `Something went wrong`,
          description: errorObj.data.detail,
          type: 'error',
          closeAfter: 5000
        })
        back()
      }

      setError(errorObj)
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionError])

  if (error && !error.data) {
    return <ErrorBlock error={error || { status: 404 }} />
  }

  return (
    <ResourceForm
      loading={loading}
      connection={connection}
      resource={resource}
      jwt={jwt}
      token={token}
    />
  )
}

export const getServerSideProps = async ({ req, res, params }: any): Promise<any> => {
  await applySession(req, res, options)

  const { jwt, token } = req.session
  const unifiedApi = params['unified-api']
  const { provider, resource } = params

  const url = `/vault/connections/${unifiedApi}/${provider}/${resource}/config`

  return {
    props: {
      jwt,
      token,
      resource,
      url
    }
  }
}

export default Resource
