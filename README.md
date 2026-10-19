# e-enum

[![NPM package][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]

> 基于npm包[enummapping](https://www.npmjs.com/package/enummapping)修改，修复ts类型报错问题

由于 `typescript` 的枚举只有 `key` `code` 的两者关联，而实际使用远远不止，还有有 `label` 甚至更多字段的关联。

**以下方法、属性使用均有 `typescript` 签名以及编辑器提示。**

> 保留字：枚举对象上的 `$list`、`$map`、`$options`、`$valueType`、`$keyType`，以及枚举项上的 `$is`、`$eq`、`$in`，均不可作为枚举 `key` 使用（运行时会抛错）。

## 语法

``` javascript
import eEnum from 'e-enum';

const enumdata = eEnum({
  key1: enumOption,
  key2: enumOption,
  /** 更多枚举项 **/
});
```

## 参数

`enumOption`：为每个枚举项属性描述，包含以下属性

| 键 | 值类型 | 是否必填 | 默认值 | 说明 |
|:--|:--:|:--:|:--:|:--|
|`code`|`string` \| `number` |✔️|-|当前枚举项的 `code` 值
|`label`|`string`|❌|-|当前枚举项的文本值
|`$sort`|`number`|❌|0|`$list`、`$map`、`$options` 等方法调用时的排序参数（按照当前值**升序**）
|`$exclude`|`boolean`|❌|false|`$list`、`$map`、`$options` 等方法调用是否忽略该项
|`[any key]`|`any`|❌|-|可以添加其他任意键值对，均支持 `ts` 声明


``` javascript
import eEnum from 'e-enum';

const gender = eEnum({
  male: { code: 1, label: '男' },
  female: { code: 2, label: '女' },
});

/** 增加自定义字段 */
const status = eEnum({
  notStart: { code: 1, label: '未开始', tagColor: 'red', /** ...more */ },
  processing: { code: 2, label: '进行中', tagColor: 'blue', /** ...more */ },
  ended: { code: 3, label: '已结束', tagColor: 'yellow', /** ...more */ },
});
```

1. 可以通过 `key` 或者 `code` 获取到当前项。

``` javascript
gender.male === gender[1]; // true

gender.male.code; // 1

/** 由于 `code` 获取不具用强约束（通常来说是服务端返回字段，可能存前端未配置项），所以TS声明为 undefined | item，在严格模式下需要使用可选链 */
gender[1]?.label; // 男

/** 通过 code 获取到的同样是完整枚举项，$is / $eq / $in 都可以直接使用 */
gender[1]?.$is('male'); // true
```

2. `enumdata.$list(exculds)`：获取通过 `$sort` 排序后的枚举列表，并排除每一项 `option.$exclude`以及参数`exculds`数组中所包含的所有项。

``` javascript
console.log(gender.$list(['male'])); // [{ code: 2, label: '女', ...more }]
```

3. `enumdata.$map(fn, exculds)`：先通过 `$list` 获取后进行遍历调用 `fn` 方法并传入当前值以及 `index`（从 0 开始，且是排序/排除之后的顺序）。相当于 `enumdata.$list(exculds).map(fn)`。

``` jsx
gender.$map((item, index) => <span key={item.code}>{item.label}</span>)
```

4. `enumdata.$options(exculds)`：通过 `$list` 获取到列表后重新生成 `value = item.code`，`label = item.label || item.code` 的数组，主要用于 `antd` 的 `Select` 组件。

``` jsx
<Select options={gender.$options()}></Select>
```

5. `enumitem.$is(key)`：判断当前项是否是某个枚举 `key`。

``` javascript
gender[1]?.$is('male'); // true
gender[1]?.$is('female'); // false
```

6. `enumitem.$eq(code)`：判断当前项是否是某个枚举 `code`。

``` javascript
gender.male.$eq(1); // true
gender.male.$eq(2); // false
```

7. `enumitem.$in(keys)`：判断当前项是否在某一系列枚举 `keys` 中。

``` javascript
gender[1].$in(['male', 'female']); // true
```

8. `$is` / `$eq` / `$in` 同时是 **类型守卫**，会按判断结果收窄枚举项类型（自定义字段也会一起收窄）。

``` typescript
const status = eEnum({
  notStart: { code: 1, label: '未开始', tagColor: 'red' },
  processing: { code: 2, label: '进行中', tagColor: 'blue' },
});

const item = status[1]!; // undefined | EnumItem，这里用 ! 收窄

if (item.$is('processing')) {
  item.tagColor; // 'blue'（不是 'red' | 'blue'）
}

if (item.$eq(1)) {
  item.tagColor; // 'red'
}

if (item.$in(['notStart', 'processing'])) {
  item.tagColor; // 'red' | 'blue'
}
```

9. 关于TS类型使用

``` typescript
// gender.ts
import eEnum from 'e-enum';

const gender = eEnum({
  male: { code: 1, label: '男' },
  female: { code: 2, label: '女' },
});
```

**方式一：枚举实例上的类型载体**（推荐，无需额外 `import`）

`$valueType`、`$keyType` 只存在于类型层，**运行时值为 `undefined`**，不要当作真实字段使用，仅用于 `typeof` 取类型。

``` typescript
// other.ts
import gender from './gender';

type GenderCode = typeof gender.$valueType; // 1 | 2
type GenderKey = typeof gender.$keyType; // 'male' | 'female'

interface Props {
  sex: GenderCode;
  labelOf?: Record<GenderKey, string>;
}
```

**方式二：导出的类型工具**

``` typescript
import { GetEnumCodeType, GetEnumKeyType, GetEnumItemType } from 'e-enum';
import gender from './gender';

type GenderCode = GetEnumCodeType<typeof gender>; // 1 | 2
type GenderKey = GetEnumKeyType<typeof gender>; // 'male' | 'female'
type GenderItem = GetEnumItemType<typeof gender>; // 所有枚举项的联合类型（含 $is / $eq / $in）

function render(item: GenderItem) {
  return item.label; // ✅ 自动提示
}
```

[npm-version-image]: https://img.shields.io/npm/v/e-enum.svg
[npm-downloads-image]: https://img.shields.io/npm/dm/e-enum.svg?style=flat
[npm-url]: https://www.npmjs.com/package/e-enum
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE