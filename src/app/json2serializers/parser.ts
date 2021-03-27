import * as _ from 'lodash';
import { CaseEnum } from './case.enum';

const PropertyPlaceholder = '{PP}'
const SerializerClassPlaceholder = '{SCP}'

interface RecursiveParseResponse {
    serializerClass: string
    serializerField?: string
}


export class JsonToSerializerParser {
    serializeNames: Array<string> = []
    preferred_case_for_fields: CaseEnum
    nameOfTheRootSerializer: string
    intent: string

    constructor(){
        this.setIntentSpaces(4)
    }

    isObject(obj: any): boolean {
        return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
    }

    parse(obj: any, preferred_case_for_fields: CaseEnum = CaseEnum.SNAKE_CASE, nameOfTheRootSerializer: string  = "Example") {
        this.serializeNames = []
        this.preferred_case_for_fields = preferred_case_for_fields
        this.nameOfTheRootSerializer = nameOfTheRootSerializer
        let code = this._parse(obj)
        code = code.replace(SerializerClassPlaceholder, "")
        return "from rest_framework import serializers\n\n" + code
    }

    _parse(obj: any, code?: string, serializerName?: string): string {
        if (!serializerName) {
            serializerName = this.nameOfTheRootSerializer
        }
        if (this.isObject(obj)) {
            if (!code) {
                code =
                    `${SerializerClassPlaceholder}` +
                    `class ${serializerName}Serializer(serializers.Serializer):\n`
            }
            for (let [key, value] of Object.entries(obj)) {
                if (value == null) {
                    continue
                }
                if (this.isObject(value)) {
                    let codeAndSerializerName = this.setSerializerClass(key, value, code)
                    code = codeAndSerializerName.code
                    serializerName = codeAndSerializerName.serializerName
                } else if (Array.isArray(value)) {
                    if (!value.length) {
                        continue
                    }
                    if (this.isObject(value[0])) {
                        let codeAndSerializerName = this.setSerializerClass(key, value[0], code, 'many=True')
                        code = codeAndSerializerName.code
                        serializerName = codeAndSerializerName.serializerName
                    } else {
                        let serializerField: string = format(this._parse(value[0], code), 'many=True')
                        code += `${this.intent}${this.changeCase(key)} = ${serializerField}\n`
                    }
                } else {
                    let serializerField: string = format(this._parse(value, code))
                    code += `${this.intent}${this.changeCase(key)} = ${serializerField}\n`
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

    private setIntentWithChar(spaces: number, intentChar: string){
        let intentStr: string = ""
        for (let i = 0; i < spaces; i++) {
            intentStr = intentStr + intentChar
        }
        this.intent = intentStr
    }

    setIntentTabs(tabs: number){
        this.setIntentWithChar(tabs, "\t")
    }

    setIntentSpaces(spaces: number){
        this.setIntentWithChar(spaces, " ")
    }

    private setSerializerClass(key: string, value: any, code: string, property: string = '') {
        if(this.isObject(value) && Object.keys(value).length==0){
            return {
                code: code,
                serializeName: null
            }
        }
        let serializerName = this.buildSerializerName(key);
        this.serializeNames.push(serializerName)
        code += `${this.intent}${this.changeCase(key)} = ${serializerName}Serializer(${property})\n`
        let subObjClass = this._parse(value, null, serializerName) + "\n"
        code = code.replace(SerializerClassPlaceholder, subObjClass)
        return {
            code: code,
            serializerName: serializerName
        }
    }

    private buildSerializerName(key: string): string {
        let serializerName: string = _.startCase(key).replace(" ", "");

        while (this.serializeNames.includes(serializerName)) {
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

        return serializerName.replace(" ", "")
    }

    private changeCase(value:string){
        switch(this.preferred_case_for_fields){
            case CaseEnum.NO_CHANGE:
                break;
            case CaseEnum.SNAKE_CASE:
                value = _.snakeCase(value)
                break;
        }
        return value.replace(" ", "")
    }
}



function format(serializerField: string, property: string = "") {
    return serializerField.replace(PropertyPlaceholder, property)
}