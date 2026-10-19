type Key = string | number | symbol;
type EnumData<C> = {
    code: C;
    label?: string;
    /** 用于获取列表的排序 */
    $sort?: number;
    /** `$list` `$map` `$options` 是否默认排除 */
    $exclude?: boolean;
    [key: Key]: unknown;
};
/** 根据 `code` 反查枚举项的 `key`，用于 `$eq` 的类型收窄 */
type KeyByCode<O, C> = {
    [K in keyof O]: O[K] extends {
        code: infer V;
    } ? [V] extends [C] ? K : never : never;
}[keyof O];
type EnumItemBuild<C, O> = {
    /** 判断当前项是否是某个枚举 `key`，同时收窄类型 */
    $is<K extends keyof O>(key?: K): this is EnumItem<C, O[K], O>;
    /** 判断当前项是否属于某组枚举 `key`，同时收窄类型 */
    $in<K extends keyof O>(keys: K[]): this is EnumItem<C, O[K], O>;
    /** 判断当前项是否是某个 `code`，同时收窄类型 */
    $eq<CC extends C>(code?: CC): this is EnumItem<C, O[KeyByCode<O, CC>], O>;
};
type EnumItem<C, D, O> = EnumItemBuild<C, O> & D;
/** 枚举的 `key` 联合类型 */
type EnumKeyType<O> = keyof O;
type EnumBuildIn<C, D, O> = {
    $list(this: Enum<C, D, O>, excludes?: EnumKeyType<O> | EnumKeyType<O>[]): EnumItem<C, D, O>[];
    $map<R>(this: Enum<C, D, O>, fn: (item: EnumItem<C, D, O>, index: number) => R, excludes?: EnumKeyType<O> | EnumKeyType<O>[]): R[];
    $options(this: Enum<C, D, O>, excludes?: EnumKeyType<O> | EnumKeyType<O>[]): {
        value: C;
        label: string;
    }[];
};
type EnumKeyRes<C, O> = {
    [key in keyof O]: EnumItem<C, O[key], O>;
};
type EnumCodeRes<C, O> = {
    [key: Key]: undefined | EnumItem<C, GetDataType<O>, O>;
};
type Enum<C, D, O> = EnumBuildIn<C, D, O> & EnumKeyRes<C, O> & EnumCodeRes<C, O> & {
    /** 仅类型载体（运行时为 `undefined`），用于获取全部 `code` 的联合类型 */
    readonly $valueType: C;
    /** 仅类型载体（运行时为 `undefined`），用于获取全部 `key` 的联合类型 */
    readonly $keyType: EnumKeyType<O>;
};
/** 获取枚举全部 `code` 的联合类型 */
export type GetEnumCodeType<T> = T extends Enum<infer C, any, any> ? C : never;
/** 获取枚举全部 `key` 的联合类型 */
export type GetEnumKeyType<T> = T extends Enum<any, any, infer O> ? EnumKeyType<O> : never;
/** 获取枚举项（含 `$is` `$eq` `$in`）的联合类型 */
export type GetEnumItemType<T> = T extends Enum<infer C, infer D, infer O> ? EnumItem<C, D, O> : never;
type GetCodeType<O> = O extends Record<Key, EnumData<infer C>> ? C : never;
type GetDataType<O> = O extends Record<Key, infer D> ? D : never;
export declare function eEnum<const O extends Record<Key, EnumData<Key>>>(data: O): Enum<GetCodeType<O>, GetDataType<O>, O>;
export default eEnum;
