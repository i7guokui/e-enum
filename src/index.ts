const assign: typeof Object.assign = function assign() {
  const to: Record<string, unknown> = {}
  for (let index = 0; index < arguments.length; index++) {
    const nextSource = arguments[index]
    if (nextSource !== null && nextSource !== void 0) {
      for (const nextKey in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey]
        }
      }
    }
  }
  return to
}

function isArray(obj: any) {
  return Object.prototype.toString.call(obj) === '[object Array]'
}

function includes(array: any[], target: any) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === target) {
      return true
    }
  }
  return false
}

type Key = string | number | symbol

type Keys<T> = T extends infer U ? keyof U : never

type EnumData<C> = {
  code: C
  label?: string
  /** 用于获取列表的排序 */
  $sort?: number
  /** `$list` `$map` `$options` 是否默认排除 */
  $exclude?: boolean
  [key: Key]: unknown
}

/** 根据 `code` 反查枚举项的 `key`，用于 `$eq` 的类型收窄 */
type KeyByCode<O, C> = {
  [K in keyof O]: O[K] extends { code: infer V }
    ? [V] extends [C]
      ? K
      : never
    : never
}[keyof O]

type EnumItemBuild<C, O> = {
  /** 判断当前项是否是某个枚举 `key`，同时收窄类型 */
  $is<K extends keyof O>(key?: K): this is EnumItem<C, O[K], O>
  /** 判断当前项是否属于某组枚举 `key`，同时收窄类型 */
  $in<K extends keyof O>(keys: K[]): this is EnumItem<C, O[K], O>
  /** 判断当前项是否是某个 `code`，同时收窄类型 */
  $eq<CC extends C>(code?: CC): this is EnumItem<C, O[KeyByCode<O, CC>], O>
}

type EnumItem<C, D, O> = EnumItemBuild<C, O> & D

/** 枚举的 `key` 联合类型 */
type EnumKeyType<O> = keyof O

type EnumBuildIn<C, D, O> = {
  $list(this: Enum<C, D, O>, excludes?: EnumKeyType<O> | EnumKeyType<O>[]): EnumItem<C, D, O>[]
  $map<R>(
    this: Enum<C, D, O>,
    fn: (item: EnumItem<C, D, O>, index: number) => R,
    excludes?: EnumKeyType<O> | EnumKeyType<O>[]
  ): R[]
  $options(
    this: Enum<C, D, O>,
    excludes?: EnumKeyType<O> | EnumKeyType<O>[]
  ): { value: C; label: string }[]
}

type EnumKeyRes<C, O> = {
  [key in keyof O]: EnumItem<C, O[key], O>
}

type EnumCodeRes<C, O> = {
  [key: Key]: undefined | EnumItem<C, GetDataType<O>, O>
}

type Enum<C, D, O> = EnumBuildIn<C, D, O> &
  EnumKeyRes<C, O> &
  EnumCodeRes<C, O> & {
    /** 仅类型载体（运行时为 `undefined`），用于获取全部 `code` 的联合类型 */
    readonly $valueType: C
    /** 仅类型载体（运行时为 `undefined`），用于获取全部 `key` 的联合类型 */
    readonly $keyType: EnumKeyType<O>
  }

/** 获取枚举全部 `code` 的联合类型 */
export type GetEnumCodeType<T> = T extends Enum<infer C, any, any> ? C : never

/** 获取枚举全部 `key` 的联合类型 */
export type GetEnumKeyType<T> = T extends Enum<any, any, infer O> ? EnumKeyType<O> : never

/** 获取枚举项（含 `$is` `$eq` `$in`）的联合类型 */
export type GetEnumItemType<T> = T extends Enum<infer C, infer D, infer O>
  ? EnumItem<C, D, O>
  : never

type GetCodeType<O> = O extends Record<Key, EnumData<infer C>>
  ? C
  : never

type GetDataType<O> = O extends Record<Key, infer D>
  ? D
  : never

const buildInEnumKeys = ['$list', '$map', '$options', '$valueType', '$keyType']
const buildInBuildItemKeys = ['$is', '$eq', '$in']

export function eEnum<const O extends Record<Key, EnumData<Key>>>(
  data: O
) {
  type C = GetCodeType<O>
  type D = GetDataType<O>
  const keyRes: EnumKeyRes<C, O> = {} as EnumKeyRes<C, O>
  const codeRes: EnumCodeRes<C, O> = {} as EnumCodeRes<C, O>

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key]

      if (includes(buildInEnumKeys, key)) {
        throw new Error(`The built-in property "${key}" cannot be used!`)
      }

      if (!value || !('code' in value)) {
        throw new Error(`Code must be specified!`)
      }

      for (let i = 0; i < buildInBuildItemKeys.length; i++) {
        if (buildInBuildItemKeys[i] in value) {
          throw new Error(`The built-in property "${buildInBuildItemKeys[i]}" cannot be used!`)
        }
      }

      if (codeRes[value.code as Keys<O>]) {
        throw new Error(`The code "${value.code?.toString?.() ?? ''}" has been used!`)
      }

      /** 运行时只做相等比较，`this is` 收窄由声明侧提供 */
      const itemBuildIn = {
        $eq: (c?: C) => c === value.code,
        $is: (k?: keyof O) => k === key,
        $in: (ks: (keyof O)[]) => includes(ks, key)
      } as unknown as EnumItemBuild<C, O>

      const item: EnumItem<C, O[typeof key], O> = assign(value, itemBuildIn)

      keyRes[key] = item
      codeRes[value.code as Keys<O>] = item as any
    }
  }

  const enumBuildIn: EnumBuildIn<C, D, O> = {
    $list(excludes = []) {
      const res: EnumItem<C, D, O>[] = []
      const excludesArr = (isArray(excludes) ? excludes : [excludes]) as EnumKeyType<O>[]

      for (const key in keyRes) {
        if (Object.prototype.hasOwnProperty.call(keyRes, key)) {
          const value = keyRes[key]
          if (!value.$exclude && !value.$in(excludesArr)) {
            res.push(value as EnumItem<C, D, O>)
          }
        }
      }

      return res.sort((a, b) => (a.$sort || 0) - (b.$sort || 0))
    },
    $map(fn, excludes = []) {
      if (typeof fn !== 'function') {
        throw new Error('is not a function!')
      }
      const res: ReturnType<typeof fn>[] = []
      const list = this.$list(excludes)

      for (let i = 0; i < list.length; i++) {
        res.push(fn(list[i], i))
      }

      return res
    },
    $options(excludes = []) {
      return this.$map(
        (item) => ({ label: item.label || String(item.code), value: item.code as C }),
        excludes
      )
    }
  }

  return assign(keyRes, codeRes, enumBuildIn) as unknown as Enum<C, D, O>
}

export default eEnum
