import { Component, OnDestroy, OnInit } from '@angular/core';
import { JsonToSerializerParser } from './json2serializers/parser';
import { CaseEnum } from './json2serializers/case.enum';
import { IndentTypeEnum } from './json2serializers/indent-type.enum';
import { MatSelectChange } from '@angular/material/select';
import { SwUpdate } from '@angular/service-worker';
import { Subscription } from 'rxjs';

interface IndentTypeConfigs {
  key: IndentTypeEnum;
  label: string;
  options: number[];
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  jsonData: any = '{\n  "name":"Ashlee Buckner",\n  "age":27,\n  "eyeColor":"green",\n  "totalProfit":45.50,\n  "parent":{\n    "isActive":true,\n    "name":"Kathleen Poole",\n    "age":36,\n    "eyeColor":"blue",\n    "parent":{\n        "name":"Tillman Ryan"\n     }\n    },\n    "friends":[\n        {"id":0,"name":"Gaines Mccall"},\n        {"id":1,"name":"Gabrielle Reid"},\n        {"id":2,"name":"Mcguire Macias"}\n    ]\n}'
  serializer: any;

  parser: JsonToSerializerParser = new JsonToSerializerParser()
  isSnakeCasePreferred: boolean = true
  nameOfTheRootSerializer: string = "Root"

  indentTypes: IndentTypeConfigs[] = [
    {
      key: IndentTypeEnum.SPACES,
      label: "Spaces",
      options: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8
      ]
    },
    {
      key: IndentTypeEnum.TABS,
      label: "Tabs",
      options: [
        1,
        2
      ]
    }
  ]
  selectedIndentType: IndentTypeConfigs = this.indentTypes[1];
  selectedIndentSize: number = this.selectedIndentType.options[0];

  subscription: Subscription;

  constructor(private readonly updates: SwUpdate) {
    this.subscription = this.updates.available.subscribe(event => {
      this.updates.activateUpdate().then(() => document.location.reload());
    });
  }

  ngOnInit(): void {
    this.initSerializer()
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  initSerializer() {
    let jsonParsed
    try {
      jsonParsed = JSON.parse(this.jsonData)
    } catch {
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
              text: this.parser.parse(
                jsonParsed,
                {
                  preferredCaseForFields: (this.isSnakeCasePreferred ? CaseEnum.SNAKE_CASE : CaseEnum.NO_CHANGE),
                  nameOfTheRootSerializer: this.nameOfTheRootSerializer,
                  selectedIndentConfigs: {
                    selectedIndentType: this.selectedIndentType.key,
                    selectedIndentSize: this.selectedIndentSize
                  }
                }
              )
            }
          ]
        },
      ]
    };
  }

  setDefaultIdentSize(selectChange: MatSelectChange) {
    let selectedIdentTypeConfig: IndentTypeConfigs = selectChange.value
    switch (selectedIdentTypeConfig.key) {
      case IndentTypeEnum.SPACES:
        this.selectedIndentSize = selectedIdentTypeConfig.options[3]
        break;
      case IndentTypeEnum.TABS:
        this.selectedIndentSize = selectedIdentTypeConfig.options[0]
        break;
    }
  }
}
