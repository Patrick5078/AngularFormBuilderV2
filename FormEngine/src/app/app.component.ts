import { exampleForm } from './forms/standard-form';
import { FormBuilderService } from './engine/form-builder.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private formBuilderService: FormBuilderService) {
        
  }

  title = 'FormEngine';

  ngOnInit() {
    const angularForm = this.formBuilderService.buildDynamicForm(exampleForm);
    console.log("------------------")
    console.log("🚀 ~ file: app.component.ts:20 ~ AppComponent ~ ngOnInit ~ angularForm", angularForm)
  }
}
