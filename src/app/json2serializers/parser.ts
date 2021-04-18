import * as _ from 'lodash';
import { CaseEnum } from './case.enum';
import { IndentTypeEnum } from './indent-type.enum';

const PropertyPlaceholder = '{PP}'
const SerializerClassPlaceholder = '{SCP}'

export interface ParsingConfigs {
    preferredCaseForFields: CaseEnum
    nameOfTheRootSerializer: string
    selectedIndentConfigs: {
        selectedIndentType: IndentTypeEnum,
        selectedIndentSize: number
    }
}

export class JsonToSerializerParser {
    serializeNames: Array<string> = []
    preferredCaseForFields: CaseEnum
    nameOfTheRootSerializer: string
    indent: string

    constructor() {
        this.setIntentWithChar(IndentTypeEnum.SPACES, 4)
    }

    parse(obj: any, configs: ParsingConfigs) {
        this.setIntentWithChar(
            configs.selectedIndentConfigs.selectedIndentType,
            configs.selectedIndentConfigs.selectedIndentSize
        )
        this.serializeNames = []
        this.preferredCaseForFields = configs.preferredCaseForFields
        this.nameOfTheRootSerializer = configs.nameOfTheRootSerializer
        let code = this._parse(obj)
        code = code.replace(SerializerClassPlaceholder, "")
        return "from rest_framework import serializers\n\n" + code
    }

    private setIntentWithChar(indentType: IndentTypeEnum, numberOfIndentChars: number) {
        let indentChar: string = this.getIndentChar(indentType)
        let indentStr: string = ""
        for (let i = 0; i < numberOfIndentChars; i++) {
            indentStr = indentStr + indentChar
        }
        this.indent = indentStr
    }

    private isObject(obj: any): boolean {
        return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
    }

    private _parse(obj: any, code?: string, serializerName?: string): string {
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
                        code += `${this.indent}${this.changeCase(key)} = ${serializerField}\n`
                    }
                } else {
                    let serializerField: string = format(this._parse(value, code))
                    code += `${this.indent}${this.changeCase(key)} = ${serializerField}\n`
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

    private getIndentChar(indentType: IndentTypeEnum): string {
        let indentChar: string;
        switch (indentType) {
            case IndentTypeEnum.SPACES:
                indentChar = " "
                break;
            case IndentTypeEnum.TABS:
                indentChar = "\t"
                break;
        }
        return indentChar
    }

    private setSerializerClass(key: string, value: any, code: string, property: string = '') {
        if (this.isObject(value) && Object.keys(value).length == 0) {
            return {
                code: code,
                serializeName: null
            }
        }
        let serializerName = this.buildSerializerName(key);
        this.serializeNames.push(serializerName)
        code += `${this.indent}${this.changeCase(key)} = ${serializerName}Serializer(${property})\n`
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

    private changeCase(value: string) {
        switch (this.preferredCaseForFields) {
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