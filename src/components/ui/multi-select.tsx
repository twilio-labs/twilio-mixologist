import Select, {
  ActionMeta,
  GroupBase,
  MultiValue,
  OptionsOrGroups,
  Props,
} from "react-select";
import colors from "tailwindcss/colors";

export default function MultiSelect({
  value,
  options,
  id,
  className,
  onChange,
  placeholder,
}: {
  value: any;
  id?: string;
  className?: string;
  options: OptionsOrGroups<any, GroupBase<any>>;
  onChange: (newValue: MultiValue<any>, actionMeta: ActionMeta<any>) => void;
  placeholder: string;
}) {
  return (
    <Select
      id={id}
      className={className}
      value={value}
      placeholder={placeholder}
      options={options}
      onChange={onChange}
      isMulti
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      theme={(theme) => {
        return {
          ...theme,
          borderRadius: 6,
          colors: {
            ...theme.colors,
            neutral10: colors.gray[200],
            neutral20: colors.gray[200],
            neutral30: colors.gray[200],
            primary25: colors.slate[50],
            primary50: colors.slate[100],
            primary75: colors.slate[50],
            primary: colors.slate[400],
          },
        };
      }}
      classNames={{
        placeholder: () => "text-sm !text-gray-400",
        container: (state) =>
          state.isFocused ? "ring-2 ring-ring ring-offset-2 rounded-md" : "",
        control: (state) => (state.isFocused ? "!border-0" : ""),
      }}
    />
  );
}
