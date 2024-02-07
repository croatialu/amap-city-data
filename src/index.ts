import axios from "axios"
import { Item } from "./type"
import { jsonArea } from "./write/json_area"
import { jsonCity } from "./write/json_city"
import { jsonLetterCity } from "./write/json_letter_city"
import { jsonPcaCascode } from "./write/json_pca_cascode"
import { jsonPcaFlat } from "./write/json_pca_flat"
import { jsonPcCascode } from "./write/json_pc_cascade"
import { jsonPcFlat } from "./write/json_pc_flat"
import { jsonProvince } from "./write/json_province"
import JSZip from 'jszip'
import xlsx from 'node-xlsx';


async function getCityData(): Promise<Item[]> {
  const response = await axios.get('https://a.amap.com/lbs/static/code_resource/AMap_adcode_citycode.zip', {
    responseType: 'arraybuffer'
  })
  const zip = new JSZip()
  await zip.loadAsync(response.data)

  const sheets = xlsx.parse(await zip.file("AMap_adcode_citycode.xlsx").async("uint8array"))

  const sheet = sheets[0]

  const data = sheet.data

  let oldAdCode: string | undefined = undefined
  return data.slice(2).map((row: string[]) => {
    const [name, adCode, cityCode] = row.map(v => v.toString().trim())

    const level: "province" | "city" | "area" = (() => {
      if (adCode.endsWith("0000")) return "province"
      if (adCode.endsWith("00")) return "city"
      return "area"
    })()

    if (level === "province") {
      oldAdCode = adCode
    }

    return {
      code: adCode,
      name,
      level,
      country_code: "100000",
      province_code: oldAdCode,
      city_code: cityCode,
      ad_code: adCode,
    } as Item
  })
}

async function main() {

  const items = await getCityData()

  jsonProvince(items)
  jsonCity(items)
  jsonArea(items)

  jsonPcaFlat(items)
  jsonPcaCascode(items)

  jsonPcFlat(items)
  jsonPcCascode(items)

  jsonLetterCity(items)

  console.log("所有文件输出完毕")
}

main()
