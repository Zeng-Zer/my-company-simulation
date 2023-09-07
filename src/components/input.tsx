import { InputHTMLAttributes, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function useInput(inputProps: InputHTMLAttributes<HTMLInputElement>, onChange: (value: string) => void = () => {}) {
  const [value, setValue] = useState(0);
  const input = <input {...inputProps} value={value} onChange={e => {
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
  const input = <select
    value={value.value as string}
    onChange={e => { setValue(options.find(option => option.value === e.target.value)) }}
  >
    {options.map(({ value, label }) => <option value={value as string}>{label}</option>)}
  </select>;
  // const input = <select value={value} onChange={e => {
  //   setValue(options[parseInt(e.target.value)])
  // }}>
  //   {options.map((option, index) => <option value={index}>{option}</option>)}
  // </select>;
        // <select name="cars" id="cars">
        //   <option value="volvo">Volvo</option>
        //   <option value="saab">Saab</option>
        //   <option value="mercedes">Mercedes</option>
        //   <option value="audi">Audi</option>
        // </select>
  return [value, setValue, input] as const;
}

export function useInputCheckbox(defaultValue = false) {
  const [value, setValue] = useState(defaultValue);
  const input = <input type="checkbox" checked={value} onChange={e => {
    setValue(e.target.checked)
  }} />;
  return [value, setValue, input] as const;
}
