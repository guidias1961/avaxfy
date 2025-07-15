 
import { Client } from '@storacha/client'
import fs from 'fs/promises'
import path from 'path'

const run = async () => {
  const client = await Client.create()
  await client.login('SEU_EMAIL_AQUI') // coloque seu e-mail real
  await client.setCurrentSpace('did:key:COLE_AQUI_SEU_DID_DO_AVAXFY_UPLOADS')

  const filePath = './1.png' // substitua pelo caminho do arquivo que quer subir
  const fileData = await fs.readFile(filePath)
  const fileName = path.basename(filePath)

  const { cid } = await client.uploadFile(fileData, fileName)

  console.log('✅ Arquivo enviado!')
  console.log('CID:', cid)
  console.log(`https://dweb.link/ipfs/${cid}`)
}

run().catch(console.error)
