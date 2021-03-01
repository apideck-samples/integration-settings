import { Button, ErrorBlock, ResourcePlaceholder, Select, TextInput } from 'components'
import { DateInput } from 'components/Inputs'
import TextArea from 'components/Inputs/TextArea'
import { Formik, FormikProps } from 'formik'
import client from 'lib/axios'
import AlertCircleIcon from 'mdi-react/AlertCircleIcon'
import ArrowLeftIcon from 'mdi-react/ArrowLeftIcon'
import CheckIcon from 'mdi-react/CheckIcon'
import Link from 'next/link'
import React, { useContext, useState } from 'react'
import { IConnection, UpdateConnectionConfigInput } from 'types/Connection'
import { JWTSession } from 'types/JWTSession'
import { SessionExpiredModalContext } from 'utils'

interface IProps {
  connection?: IConnection
  loading: boolean
  jwt: string
  token: JWTSession
  resource: string
}

const ResourceForm = ({ loading, connection, resource, jwt, token }: IProps) => {
  const [saved, setSaved] = useState(false)
  const [formError, setFormError] = useState(false)
  const { setSessionExpired } = useContext(SessionExpiredModalContext)

  if (loading) return <ResourcePlaceholder />

  if (!connection) {
    const error = { status: 404 }
    return <ErrorBlock error={error} />
  }

  const {
    unified_api: unifiedApi,
    service_id: serviceId,
    configuration: formFields = []
  } = connection

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialValues = formFields.reduce((acc: any, formField) => {
    const { id, value } = formField
    acc[id] = value || undefined
    return acc
  }, {}) as Record<string, readonly string[]>

  const headers = {
    Authorization: `Bearer ${jwt}`,
    'X-APIDECK-APP-ID': token.applicationId,
    'X-APIDECK-CONSUMER-ID': token.consumerId
  }

  const updateResourceConfig = async (values: Record<string, string | boolean | unknown>) => {
    setFormError(false)
    const defaults = Object.entries(values)
      .map(([k, v]) => {
        return v ? { id: k, value: v } : undefined
      })
      .filter((obj) => obj?.value)

    const body = {
      configuration: [
        {
          resource,
          defaults
        }
      ]
    } as UpdateConnectionConfigInput

    try {
      await client.patch(`/vault/connections/${unifiedApi}/${serviceId}/${resource}/config`, body, {
        headers
      })
      setSaved(true)
    } catch (error) {
      setFormError(true)

      const { response } = error
      const { status } = response

      if (status === 401) {
        setSessionExpired(true)
      }
    }
  }

  return (
    <>
      <Link href={`/integrations/${unifiedApi}/${serviceId}/`}>
        <button
          className="inline-flex items-center self-start justify-start mb-4 text-sm leading-none text-gray-600 group hover:text-gray-800"
          style={{ height: '24px' }}
        >
          <ArrowLeftIcon
            className="mr-1 transition duration-150 ease-in-out"
            color="currentColor"
            size={16}
          />
          <span className="capitalize transition duration-150 ease-in-out">
            {connection.service_id} Settings
          </span>
        </button>
      </Link>

      {formFields.length > 0 && (
        <Formik
          onSubmit={(values) => updateResourceConfig(values)}
          initialValues={initialValues}
          validateOnChange={false}
          validateOnBlur={false}
        >
          {(formikProps: FormikProps<Record<string, readonly string[]>>) => {
            const { handleSubmit, isSubmitting, handleChange, handleBlur, values } = formikProps

            return (
              <form className="mt-2 border rounded-md" onSubmit={handleSubmit}>
                <div className="px-5 py-4">
                  <h2 className="font-medium capitalize">{resource} Configuration</h2>
                </div>
                <div className="px-5 py-6 bg-gray-100 border-t border-b">
                  {formFields?.map((field) => {
                    const { id, label, required, placeholder, description, type, options } = field
                    let fieldType = type
                    if (type === 'phone') fieldType = 'tel'
                    if (type === 'location') fieldType = 'text'
                    return (
                      <div key={id} className="flex items-start justify-center mb-4">
                        <div className="w-1/3 pt-2 pr-2 text-sm font-medium text-right text-gray-600">
                          {label}
                          {required && (
                            <span className="ml-1 text-red-600" data-testid="required">
                              *
                            </span>
                          )}
                        </div>
                        <div className="w-2/3 pl-2">
                          {[
                            'text',
                            'checkbox',
                            'email',
                            'url',
                            'phone',
                            'number',
                            'time',
                            'location'
                          ].includes(type as string) && (
                            <TextInput
                              name={id}
                              value={values[id] || ''}
                              type={fieldType as string}
                              required={required}
                              placeholder={placeholder}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          )}
                          {type === 'textarea' && (
                            <TextArea
                              name={id}
                              value={values[id]}
                              required={required}
                              placeholder={placeholder}
                              onChange={handleChange}
                            />
                          )}
                          {(type === 'select' || type === 'multi-select') && (
                            <Select
                              field={id}
                              type={type}
                              required={required}
                              options={options}
                              formikProps={formikProps}
                            />
                          )}
                          {(type === 'date' || type === 'datetime') && (
                            <DateInput
                              name={id}
                              value={values[id]}
                              required={required}
                              onChange={handleChange}
                            />
                          )}
                          {description && (
                            <small className="inline-block pt-2 ml-2 text-gray-600">
                              {description}
                            </small>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between px-5 py-2">
                  <div className="flex items-center justify-start">
                    {saved && (
                      <>
                        <span className="mr-2 text-primary">
                          <CheckIcon size={20} color="currentColor" />
                        </span>
                        <span className="text-sm">Your changes have been saved.</span>
                      </>
                    )}
                    {formError && (
                      <>
                        <span className="mr-2 text-red-600">
                          <AlertCircleIcon color="currentColor" size={20} />
                        </span>
                        <span className="text-red-600" style={{ fontSize: '0.9375rem' }}>
                          Your changes could not be saved. Please try again.
                        </span>
                      </>
                    )}
                  </div>
                  <Button
                    type="submit"
                    text={isSubmitting ? 'Saving..' : 'Save'}
                    disabled={isSubmitting}
                  />
                </div>
              </form>
            )
          }}
        </Formik>
      )}
    </>
  )
}
export default ResourceForm
