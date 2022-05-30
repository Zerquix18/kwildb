export interface KwilDBConnectorConfig {
  host?: string;
  protocol?: string;
  moat: string;
  privateKey: any;
}

export interface KeyValueObject {
  [key: string]: string | number | null;
}

export type ConditionOperator = '=' | '!=' | '>' | '<' | 'like';

export type SimpleCondition = {
  field: string;
  operator: ConditionOperator;
  value: string | number;
}

export type NullCondition = {
  field: string;
  operator: 'null' | 'not_null';
}

export type BetweenCondition = {
  field: string;
  operator: 'between';
  values: [number, number];
}

export type InCondition = {
  field: string;
  operator: 'in';
  values: (string | number)[];
}

export type Condition = SimpleCondition | NullCondition | BetweenCondition | InCondition;
export type Order = 'asc' | 'desc';

export type KeyValueString = {
  [key: string]: string;
}
