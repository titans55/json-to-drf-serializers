import * as _ from 'lodash';

const PropertyPlaceholder = '{PP}'
const SerializerClassPlaceholder = '{SCP}'

interface RecursiveParseResponse {
    serializerClass: string
    serializerField?: string
}


export class JsonToSerializerParser {
    serializeNames: Array<string> = []
    isObject(obj: any): boolean {
        return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
    }

    parse(obj: any) {
        this.serializeNames = []
        let code = this._parse(obj)
        code = code.replace(SerializerClassPlaceholder, "")
        return "from rest_framework import serializers\n\n" + code
    }

    _parse(obj: any, code?: string, serializerName?: string): string {
        if (!serializerName) {
            serializerName = 'Example'
        }
        if (this.isObject(obj)) {
            if (!code) {
                code =
                    `${SerializerClassPlaceholder}` +
                    `class ${serializerName}Serializer(serializers.Serializer):\n`
            }
            for (let [key, value] of Object.entries(obj)) {
                if (this.isObject(value)) {
                    let serializerName = this.buildSerializerName(key);
                    this.serializeNames.push(serializerName)
                    code += `   ${_.snakeCase(key)} = ${serializerName}Serializer()\n`
                    let subObjClass = this._parse(value, null, serializerName) + "\n"
                    code = code.replace(SerializerClassPlaceholder, subObjClass)
                } else if (Array.isArray(value)) {
                    if (this.isObject(value[0])) {
                        let serializerName = this.buildSerializerName(key);
                        this.serializeNames.push(serializerName)
                        code += `   ${_.snakeCase(key)} = ${serializerName}Serializer(many=True)\n`
                        let subObjClass = this._parse(value[0], null, serializerName) + "\n"
                        code = code.replace(SerializerClassPlaceholder, subObjClass)
                    } else {
                        let serializerField: string = format(this._parse(value[0], code), 'many=True')
                        code += `   ${_.snakeCase(key)} = ${serializerField}\n`
                    }

                } else {
                    let serializerField: string = format(this._parse(value, code))
                    code += `   ${_.snakeCase(key)} = ${serializerField}\n`
                }
            }

        } else {
            if (typeof obj === 'string' || obj instanceof String) {
                return `serializers.CharField(${PropertyPlaceholder})`
            }
            if (typeof obj === "boolean") {
                return `serializers.BooleanField(${PropertyPlaceholder})`
            }
            if (Number.isInteger(obj)) {
                return `serializers.IntegerField(${PropertyPlaceholder})`
            }
            if (!isNaN(obj) && obj.toString().indexOf('.') != -1) {
                return `serializers.DecimalField(${PropertyPlaceholder})`
            }
            return 'serializers.NoneField()'
        }

        return code
    }

    private buildSerializerName(key: string): string {
        let serializerName: string = _.startCase(key).replace(" ", "");

        while(this.serializeNames.includes(serializerName)){
            let lastCharOfSerializerName = serializerName.slice(-1)
            if (isNaN(<any>lastCharOfSerializerName)) {
                serializerName += "1"
            } else {
                let number: number = parseInt(lastCharOfSerializerName)
                number += 1
                if (number < 10) {
                    serializerName = serializerName.slice(0, -1) + number.toString()
                } else {
                    serializerName += "0"
                }
            }
        }

        return serializerName
    }
}

function format(serializerField: string, property: string = "") {
    return serializerField.replace(PropertyPlaceholder, property)
}