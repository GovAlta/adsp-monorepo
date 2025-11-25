export interface UseEnterpriseOptions<TCEData, TEEData, TDefaultValue, TCombinedValue> {
    defaultValue?: TDefaultValue;
    combine?: (ceData: TCEData, eeData: TEEData) => TCombinedValue;
    enabled?: boolean;
}
type UseEnterpriseReturn<TCEData, TEEData, TDefaultValue, TCombinedValue> = TDefaultValue extends null ? TCEData | TEEData | TCombinedValue | null : TCEData | TEEData | TCombinedValue | TDefaultValue;
export declare const useEnterprise: <TCEData, TEEData = TCEData, TCombinedValue = TEEData, TDefaultValue = TCEData>(ceData: TCEData, eeCallback: () => Promise<TEEData>, opts?: UseEnterpriseOptions<TCEData, TEEData, TDefaultValue, TCombinedValue>) => UseEnterpriseReturn<TCEData, TEEData, TDefaultValue, TCombinedValue>;
export {};
