import { Component, OnInit } from '@angular/core';
import { JsonToSerializerParser } from './json2serializers/parser';
import { CaseEnum } from './json2serializers/case.enum';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  jsonData: any = '{\n  "name":"Ashlee Buckner",\n  "age":27,\n  "eyeColor":"green",\n  "totalProfit":45.50,\n  "parent":{\n    "isActive":true,\n    "name":"Kathleen Poole",\n    "age":36,\n    "eyeColor":"blue",\n    "parent":{\n        "name":"Tillman Ryan"\n     }\n    },\n    "friends":[\n        {"id":0,"name":"Gaines Mccall"},\n        {"id":1,"name":"Gabrielle Reid"},\n        {"id":2,"name":"Mcguire Macias"}\n    ]\n}'
  serializer: any;

  parser: JsonToSerializerParser = new JsonToSerializerParser()
  isSnakeCasePreferred: boolean = true
  nameOfTheRootSerializer: string = "Root"

  ngOnInit(): void {
    this.initSerializer()
  }

  initSerializer() {
    console.log(this.jsonData)
    let jsonParsed 
    try{
      jsonParsed = JSON.parse(this.jsonData)
    }catch{
      alert("JSON is not valid")
      return
    }
    this.serializer = {
      type: "doc",
      content: [
        {
          type: "code_block",
          content: [
            {
              type: "text",
              text: this.parser.parse(jsonParsed, (this.isSnakeCasePreferred ? CaseEnum.SNAKE_CASE : CaseEnum.NO_CHANGE), this.nameOfTheRootSerializer)
            }
          ]
        },
      ]
    };

  }


}
