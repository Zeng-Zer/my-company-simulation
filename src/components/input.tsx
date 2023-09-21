import { InputHTMLAttributes, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function useInput(inputProps: InputHTMLAttributes<HTMLInputElement>, onChange: (value: string) => void = () => {}) {
  const [value, setValue] = useState((inputProps.value ?? 0) as number);
  const input =
    <input {...inputProps} value={value} onChange={e => {
      setValue(parseInt(e.target.value))
      onChange(e.target.value)
    }} />;

  return [value, setValue, input] as const;
}

interface DropdownInput<T> {
  value: T;
  label: string;
}

export function useInputDropdown<T>(options: DropdownInput<T>[]) {
  const [value, setValue] = useState(options[0]);
  const input =
    <select
      value={value.value as string}
      onChange={e => { setValue(options.find(option => option.value === e.target.value)) }}
    >
      {options.map(({ value, label }) => <option key={value as string} value={value as string}>{label}</option>)}
    </select>;

  return [value, setValue, input] as const;
}

export function useInputCheckbox(defaultValue = false) {
  const [value, setValue] = useState(defaultValue);
  const input = <input type="checkbox" checked={value} onChange={e => {
    setValue(e.target.checked)
  }} />;
  return [value, setValue, input] as const;
}

interface SliderInput {
  min: number;
  max: number;
  value: number;
}

export function useInputSlider(options: SliderInput) {
  const [value, setValue] = useState(options.value);
  const input =
    <input type="range" className="slider" min={options.min} max={options.max} value={value} onChange={e => {
      setValue(parseInt(e.target.value))
    }} />;

  return [value, setValue, input] as const;
}

// submit button
export function useSubmitButton(value: string, onSubmit: () => void, disabled = false) {
  const [submit, setSubmit] = useState(false);
  const input = <input type="submit" disabled={disabled} value={value} onClick={() => {
    onSubmit()
    setSubmit(true)
  }} />;

  return [submit, setSubmit, input] as const;
}
