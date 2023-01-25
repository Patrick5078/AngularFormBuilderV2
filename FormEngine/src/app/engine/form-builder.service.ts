import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ArrayDefaultValue, DynamicForm, Field as DynamicFormField, FieldType, Operator } from '../forms/standard-form';

@Injectable({
  providedIn: 'root'
})
export class FormBuilderService {

  constructor() { }
  
  buildDynamicForm(form: DynamicForm) : { formGroup: FormGroup, ruleSubscriptions: Subscription  }  {
    const baseForm = new FormGroup({});
    const uniqueNameToFormControlMap = new Map<string, ControlMapItem>();
    const subscriptions = new Subscription();
    
    for (const sectionKey in form.sections) {
      const section = form.sections[sectionKey];
      const formGroupForSection = new FormGroup({});
      baseForm.addControl(sectionKey, formGroupForSection);

      for (const fieldKey in section.fields) {
        const field = section.fields[fieldKey];
        const result = this.getFormControlFromField(field, fieldKey, uniqueNameToFormControlMap);
        subscriptions.add(result.relatedArraySubscriptions);
        formGroupForSection.addControl(fieldKey, result.formControl);
      }
    }

    this.addValidatorsToControls(uniqueNameToFormControlMap);
    const ruleSubscriptions = this.addLogicRulesToForm(uniqueNameToFormControlMap);
    subscriptions.add(ruleSubscriptions);

    return { formGroup: baseForm, ruleSubscriptions: subscriptions };
  }

  private getFormControlFromField(field: DynamicFormField, baseFieldKey: string, uniqueNameToFormControlMap: Map<string, ControlMapItem>): { formControl: AbstractControl<any,any>, relatedArraySubscriptions: Subscription }  {
    const relatedSubscriptions = new Subscription();
    let controlToReturn: AbstractControl<any,any>;
    switch (field.type) {
      case FieldType.Text:
        controlToReturn = new FormControl(field.defaultValue); 
        break;
      case FieldType.Array:
        const result = this.createArrayField(field, baseFieldKey, uniqueNameToFormControlMap);
        controlToReturn = result.formArray;
        relatedSubscriptions.add(result.relatedArraySubscriptions);
        break;
      default: throw new Error(`Unknown field type '${field.type}' for field '${baseFieldKey}'`);
    }

    if (uniqueNameToFormControlMap.has(baseFieldKey)) {
      throw new Error(`Duplicate field key '${baseFieldKey}.' Field keys must be unique.`);
    }

    uniqueNameToFormControlMap.set(baseFieldKey, { control: controlToReturn, field });
    return { formControl: controlToReturn, relatedArraySubscriptions: relatedSubscriptions }
  }

  private createArrayField(field: DynamicFormField, baseFieldKey: string, uniqueNameToFormControlMap: Map<string, ControlMapItem>): { formArray: AbstractControl<any,any>, relatedArraySubscriptions: Subscription }  {
    if (field.arrayFields === undefined || Object.keys(field.arrayFields).length === 0) {
      throw new Error(`Array field '${baseFieldKey}' does not have any array fields defined.`);
    }
    const subscriptions = new Subscription();
    const formArray = new FormArray<FormGroup>([]);
    if (field.defaultValue) {
      for (const value of field.defaultValue as ArrayDefaultValue) {
        const formGroup = new FormGroup({});
        const formGroupUniqueNameToFormControlMap = new Map<string, ControlMapItem>();

        for (const fieldKey in value) {
          const arrayField = field.arrayFields[fieldKey];

          if (arrayField === undefined) {
            throw new Error(`Array field '${baseFieldKey}' does not have an array field with key '${fieldKey}'. The values defined in the defaultValue field must match the keys of the arrayFields field.`);
          }
          arrayField.defaultValue = value[fieldKey];

          // Small hack to get around the fact that we can't have duplicate keys at this step
          // Despite the array possibly having multiple fields entries, and thus ending up with duplicate keys
          if (uniqueNameToFormControlMap.has(fieldKey)) {
            uniqueNameToFormControlMap.delete(fieldKey);
          }

          if (arrayField.type === FieldType.Array) {
            throw new Error(`Array field '${baseFieldKey}' has an array field with key '${fieldKey}' which is also an array. Nested arrays are not supported.`);
          }

          const result = this.getFormControlFromField(arrayField, fieldKey, formGroupUniqueNameToFormControlMap);
          formGroup.addControl(fieldKey, result.formControl);
          formGroupUniqueNameToFormControlMap.set(fieldKey, { control: result.formControl, field: arrayField });
        }

        formArray.push(formGroup);
        this.addValidatorsToControls(formGroupUniqueNameToFormControlMap);
        const ruleSubscriptions = this.addLogicRulesToForm(formGroupUniqueNameToFormControlMap);
        subscriptions.add(ruleSubscriptions);
      }
    }

    return { formArray, relatedArraySubscriptions: subscriptions };
  } 

  private addValidatorsToControls(uniqueNameToFormControlMap: Map<string, ControlMapItem>) {
    for (const controlMapItem of uniqueNameToFormControlMap.values()) {
      const { control, field } = controlMapItem;

      if (!field.validators) {
        return;
      }

      const validators = [];
      
      if (field.validators.required) {
        validators.push(Validators.required);
      }
      
      if (field.validators.minLength) {
      validators.push(Validators.minLength(field.validators.minLength));
    }

    if (field.validators.maxLength) {
      validators.push(Validators.maxLength(field.validators.maxLength));
    }
    
      control.setValidators(validators);
      control.updateValueAndValidity();
    }
  }

  private addLogicRulesToForm(uniqueNameToFormControlMap: Map<string, ControlMapItem>) : Subscription {
    const subscriptions = new Subscription();

    for (const controlMapItem of uniqueNameToFormControlMap.values()) {
      const { control, field } = controlMapItem;

      if (field.logicRules) {
        for (const ruleKey in field.logicRules) {
          const rule = field.logicRules[ruleKey as keyof typeof field.logicRules];

          for (const ruleFieldKey in rule) {
            const ruleField = rule[ruleFieldKey];
            let ruleFieldControl: AbstractControl<any,any> = null!;
            try {
              ruleFieldControl = uniqueNameToFormControlMap.get(ruleFieldKey)!.control;
            } catch {
              throw new Error(`Could not find control with name '${ruleFieldKey}' while attempting to apply logic rule. Make sure '${ruleFieldKey}' is declared as a field in the JSON structure.`);
            }

            subscriptions.add(ruleFieldControl.valueChanges.subscribe(value => {
              if (ruleField.operator === Operator.Equals) {
                if (value === ruleField.value) {
                  this.setRule(ruleKey, control, true);
                } else {
                  this.setRule(ruleKey, control, false);
                }
              }

              if (ruleField.operator === Operator.NotEquals) {
                if (value !== ruleField.value) {
                  this.setRule(ruleKey, control, true);
                } else {
                  this.setRule(ruleKey, control, false);
                }
              }
            }));
          }
        }
      }
    }

    return subscriptions;
  }

  private setRule(ruleKey: string, control: AbstractControl, conditionWasMet: boolean) {
    switch (ruleKey) {
      case 'show':
        if (conditionWasMet) {
          control.enable();
        } else {
          control.disable();
        }
        break;
      case 'disable':
        if (conditionWasMet) {
          control.disable();
        } else {
          control.enable();
        }
        break;
      case 'required':
        if (conditionWasMet) {
          control.setValidators(Validators.required);
        } else {
          control.clearValidators();
        }
        break;
    }
  }
}

export type ControlMapItem = {
  control: AbstractControl,
  field: DynamicFormField
}
