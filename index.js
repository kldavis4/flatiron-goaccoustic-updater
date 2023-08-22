require('dotenv').config()
const fetch = require('node-fetch')
const xml2json = require('xml2json')
const csvtojson = require('csvtojson')

const getAccessToken = async ({
    apiHost,
    clientId,
    clientSecret,
    refreshToken
}) => {
    const params = new URLSearchParams()
    params.append('client_id', clientId)
    params.append('client_secret', clientSecret)
    params.append('refresh_token', refreshToken)
    params.append('grant_type', 'refresh_token')

    const response = await fetch(`https://${apiHost}/oauth/token`, {
        method: 'POST', 
        body: params, 
    })
    const result = await response.json()
    return result['access_token']
}

const getRecipient = async ({
    apiHost,
    email,
    emailField,
    listId,
    accessToken
}) => {
    const body = new URLSearchParams()
    body.append('xml', `<Envelope>
    <Body>
      <SelectRecipientData>
      <LIST_ID>${listId}</LIST_ID>
      <EMAIL>${email}</EMAIL>
      <COLUMN><NAME>${emailField}</NAME><VALUE>${email}</VALUE></COLUMN>
    </SelectRecipientData>
   </Body>
  </Envelope>`)

  const response = await fetch(`https://${apiHost}/XMLAPI`, {
    method: 'POST',
    body,
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
  })

  return JSON.parse(xml2json.toJson(await response.text()))
}

const updateRecipient = async ({
    apiHost,
    email,
    listId,
    emailField,
    updateField,
    updateValue,
    accessToken
}) => {
    const body = new URLSearchParams()
    const template = `<Envelope>
    <Body>
      <UpdateRecipient>
      <LIST_ID>${listId}</LIST_ID>
      <SYNC_FIELDS>
      <SYNC_FIELD>
        <NAME>${emailField}</NAME>
        <VALUE>${email}</VALUE>
      </SYNC_FIELD>
    </SYNC_FIELDS>
      <COLUMN>
        <NAME>${updateField}</NAME><VALUE>${updateValue}</VALUE>
      </COLUMN>
    </UpdateRecipient>
   </Body>
    </Envelope>`
    body.append('xml', template)

  const response = await fetch(`https://${apiHost}/XMLAPI`, {
    method: 'POST',
    body,
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
  })

    return {
        success: response.status === 200,
        body: await response.text()
    }
}

(async () => {
    const token = await getAccessToken({
        apiHost: process.env.API_HOST,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
    })

    csvtojson().fromFile(process.env.CSV_INPUT).then(async (rows) => {
        for (const row of rows) {
            const email = row[process.env.EMAIL_FIELD]
            const updateValue = row[process.env.UPDATE_FIELD]

            if (!updateValue || !email) {
                console.log('No update value or email')
                process.exit(1)
            }

            const recipient = await getRecipient({
                apiHost: process.env.API_HOST,
                accessToken: token,
                listId: process.env.LIST_ID,
                email,
                emailField: process.env.EMAIL_FIELD
            })
            
            if (!recipient) {
                console.log('No recipient')
                process.exit(1)
            }

            const columns = recipient['Envelope']['Body']['RESULT']['COLUMNS']['COLUMN']
            let updateColumn
            for (const column of columns) {
                if (column['NAME'] === process.env.UPDATE_FIELD) {
                    updateColumn = column
                    break
                }
            }

            if (!updateColumn || updateColumn['VALUE'] !== updateValue) {
                const result = await updateRecipient({
                    apiHost: process.env.API_HOST,
                    accessToken: token,
                    listId: process.env.LIST_ID,
                    email,
                    emailField: process.env.EMAIL_FIELD,
                    updateField: process.env.UPDATE_FIELD,
                    updateValue
                })

                if (!result.success) {
                    console.log('Failed to update recipient')
                    console.log(result.body)
                    process.exit(1)
                }

                console.log(`Updated ${email} to ${updateValue}`)
            }
          }
    })
})()