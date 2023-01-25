export enum FieldType {
    Text,
    Array
}

export enum Operator {
    Equals,
    NotEquals
}

export const exampleForm: DynamicForm = {
    sections: {
        section1: {
            name: {
                danish: 'Sektion 1',
                english: 'Section 1'
            },
            fields: {
                field1: {
                    type: FieldType.Text,
                    label: {
                        danish: 'Felt 1',
                        english: 'Field 1'
                    },
                    defaultValue: "TEST",
                    validators: {
                        required: true,
                        minLength: 5,
                        maxLength: 10
                    },
                    logicRules: {
                        show: {
                            field2: {
                                value: 'Field 2 value',
                                operator: Operator.Equals
                            }
                        },
                        disable: {
                            field2: {
                                value: 'Field 2 value',
                                operator: Operator.Equals
                            }
                        },
                        required: {
                            field2: {
                                value: 'Field 2 value',
                                operator: Operator.Equals
                            }
                        }
                    }
                },
                field2: {
                    type: FieldType.Text,
                    label: {
                        danish: 'Felt 2',
                        english: 'Field 2'
                    },
                    defaultValue: 'Field 2 value',
                },
                field3: {
                    type: FieldType.Array,
                    label: {
                        danish: 'Felt 3',
                        english: 'Field 3'
                    },
                    arrayFields: {
                        field3Item1: {
                            type: FieldType.Text,
                            label: {
                                danish: 'Felt 3 item 1',
                                english: 'Field 3 item 1'
                            },
                            defaultValue: 'Field 3 item 1 value',
                        },
                        field3Item2: {
                            type: FieldType.Text,
                            label: {
                                danish: 'Felt 3 item 2',
                                english: 'Field 3 item 2'
                            },
                            defaultValue: 'Field 3 item 2 value',
                            logicRules: {
                                disable: {
                                    field3Item1: {
                                        value: 'Field 3 item 1 value',
                                        operator: Operator.NotEquals
                                    }
                                }
                            }
                        }
                    },
                    defaultValue: [
                        {
                            field3Item1: 'Field 3 item 1 value',
                            field3Item2: 'Field 3 item 2 value'
                        },
                        {
                            field3Item1: 'Field 3 item 1 value',
                            field3Item2: 'Field 3 item 2 value'
                        },
                        {
                            field3Item1: 'Field 3 item 1 value',
                            field3Item2: 'Field 3 item 2 value'
                        }
                    ] as ArrayDefaultValue,
                    logicRules: {},
                }
            }
        }
    }
}

/**
 * The structure of a dynamic form is defined by this interface.
 * The form is divided into sections, which are divided into fields.
 * Each field has a type, a label, a default value, as well as optional validators and logic rules.
 * The logic rules are used to show/hide/disable/require fields based on the values of other fields.
 * The validators are used to validate the values of the fields.
 * 
 * The logic rules work as follows:
 * Consider the following example:
 * field1 : {
 *  logicRules: {
 *     disable: {
 *      field2: {
 *       value: true,
 *       operator: Operator.Equals
 *   }
 * }
 * 
 * This means that field1 should be disabled if field2 has the value true.
 */
export type DynamicForm = {
    sections: {
        [key: string]: {
            fields?: {
                [key: string]: Field
            },
            name: LabelsInSupportedLanguages
        }
    }
}

export type ArrayDefaultValue = {
    [key: string]: any
}[]

export type LabelsInSupportedLanguages = {
    danish: string,
    english: string,
}

export type Field = {
    type: FieldType,
    label: LabelsInSupportedLanguages,
    defaultValue: any,
    arrayFields?: { [key: string]: Field },
    validators?: {
        required?: boolean,
        minLength?: number,
        maxLength?: number
    },
    logicRules?: {
        show?: {
            [key: string]: {
                value: any,
                operator: Operator
            }
        },
        disable?: {
            [key: string]: {
                value: any,
                operator: Operator
            }
        },
        required?: {
            [key: string]: {
                value: any,
                operator: Operator
            }
        }
    }
}