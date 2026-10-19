import eEnum, { GetEnumCodeType, GetEnumItemType, GetEnumKeyType } from '../src/index'

describe('eEnum', () => {

  describe('base', () => {
    test('should create an Enum object with key-value pairs', () => {
      const data = {
        A: { code: 1, label: 'Option A' },
        B: { code: 2, label: 'Option B' },
        C: { code: 3, label: 'Option C' },
      };
  
      const enumObject = eEnum(data);
  
      expect(enumObject.A.code).toEqual(1);
      expect(enumObject.B.label).toEqual('Option B');
      expect(enumObject.C.$eq(3)).toBe(true);
      expect(enumObject.C.$in(['A', 'B'])).toBe(false);
      expect(enumObject.C.$in(['A', 'B', 'C'])).toBe(true);
      expect(enumObject.C.$is('A')).toBe(false);
      expect(enumObject.C.$is('C')).toBe(true);
      expect(enumObject[1]?.label).toEqual('Option A');
    });

    test('should throw an error if using built-in properties', () => {
      expect(() => eEnum({$list: { code: 1 }})).toThrowError('The built-in property "$list" cannot be used!');
      expect(() => eEnum({$map: { code: 1 }})).toThrowError('The built-in property "$map" cannot be used!');
      expect(() => eEnum({$options: { code: 1 }})).toThrowError('The built-in property "$options" cannot be used!');
    });

    test('should throw an error if code is not specified', () => {
      const data = {
        A: { label: 'Option A' },
      };
  
      expect(() => eEnum(data as any)).toThrowError('Code must be specified!');
    });

    test('should throw an error if a code has been used', () => {
      const data = {
        A: { code: 1 },
        B: { code: 1 },
      };
  
      expect(() => eEnum(data)).toThrowError('The code "1" has been used!');
    });
  })

  describe('$list', () => {
    test('should return a list of Enum items', () => {
      const data = {
        A: { code: 1 },
        B: { code: 2 },
        C: { code: 3 },
      };
  
      const enumObject = eEnum(data);
      const list = enumObject.$list();
  
      expect(list.length).toBe(3);
      expect(list[0].$is('A')).toBe(true);
      expect(list[1].$in(['B', 'C'])).toBe(true);
      expect(list[2].$eq(3)).toBe(true);
    });

    test('should sort enum items in ascending order based on $sort property', () => {
      const data = {
        item1: { code: 'item1', $sort: 2 },
        item2: { code: 'item2', $sort: 1 },
        item3: { code: 'item3', $sort: 3 },
      };
      const enumInstance = eEnum(data);
  
      const sortedList = enumInstance.$list();
      expect(sortedList).toHaveLength(3);
      expect(sortedList[0].code).toBe('item2');
      expect(sortedList[1].code).toBe('item1');
      expect(sortedList[2].code).toBe('item3');
    });

    test('should exclude specified items from the list', () => {
      const data = {
        item1: { code: 'item1' },
        item2: { code: 'item2' },
        item3: { code: 'item3' },
      };
      const enumInstance = eEnum(data);
  
      const excludes: (keyof typeof data)[] = ['item2'];
      const sortedList = enumInstance.$list(excludes);
      expect(sortedList).toHaveLength(2);
      expect(sortedList[0].code).toBe('item1');
      expect(sortedList[1].code).toBe('item3');

      const enumData = eEnum({
        item1: { code: 'item1', $exclude: true },
        item2: { code: 'item2' },
        item3: { code: 'item3' },
      });
      const list = enumData.$list();
      expect(list).toHaveLength(2);
      expect(list[0].code).toBe('item2');
      expect(list[1].code).toBe('item3');
    });
  });

  describe('$map', () => {
    test('should return a mapped array based on Enum items', () => {
      const data = {
        A: { code: 1 },
        B: { code: 2 },
        C: { code: 3 },
      };
  
      const enumObject = eEnum(data);
      const mappedArray = enumObject.$map(item => item.code);
  
      expect(mappedArray).toEqual([1, 2, 3]);
    });

    test('should exclude specified items when mapping', () => {
      const data = {
        item1: { code: 'item1' },
        item2: { code: 'item2' },
        item3: { code: 'item3' },
      };
      const enumInstance = eEnum(data);
  
      const excludes: (keyof typeof data)[] = ['item2'];
      const mapper = (item: any) => item.code;
      const mappedList = enumInstance.$map(mapper, excludes);
  
      expect(mappedList).toHaveLength(2);
      expect(mappedList[0]).toBe('item1');
      expect(mappedList[1]).toBe('item3');

      const enumData = eEnum({
        item1: { code: 'item1', $exclude: true },
        item2: { code: 'item2' },
        item3: { code: 'item3' },
      });
      const list = enumData.$map(mapper);
      expect(list).toHaveLength(2);
      expect(list[0]).toBe('item2');
      expect(list[1]).toBe('item3');
    });
  })

  describe('$options', () => {
    test('should return options array based on Enum items', () => {
      const data = {
        A: { code: 1, label: 'Option A' },
        B: { code: 2, label: 'Option B' },
        C: { code: 3 },
      };
  
      const enumObject = eEnum(data);
      const optionsArray = enumObject.$options();
  
      expect(optionsArray).toEqual([
        { value: 1, label: 'Option A' },
        { value: 2, label: 'Option B' },
        { value: 3, label: '3' },
      ]);
    });

    test('should exclude specified items when generating options', () => {
      const data = {
        item1: { code: 'item1', label: 'Item 1' },
        item2: { code: 'item2', label: 'Item 2' },
        item3: { code: 'item3', label: 'Item 3' },
      };
      const enumInstance = eEnum(data);
  
      const excludes: (keyof typeof data)[] = ['item2'];
      const options = enumInstance.$options(excludes);
      expect(options).toHaveLength(2);
      expect(options[0]).toEqual({ value: 'item1', label: 'Item 1' });
      expect(options[1]).toEqual({ value: 'item3', label: 'Item 3' });

      const enumData = eEnum({
        item1: { code: 'item1', $exclude: true },
        item2: { code: 'item2' },
        item3: { code: 'item3' },
      });
      const list = enumData.$options();
      expect(list).toHaveLength(2);
      expect(list[0].value).toBe('item2');
      expect(list[1].value).toBe('item3');
    });
  })

  describe('type carriers', () => {
    test('$valueType / $keyType narrow code and key unions', () => {
      const gender = eEnum({
        male: { code: 1, label: '男' },
        female: { code: 2, label: '女' },
      });

      const code: typeof gender.$valueType = 1;
      const key: typeof gender.$keyType = 'male';

      // @ts-expect-error 3 is not a valid code
      const badCode: typeof gender.$valueType = 3;
      // @ts-expect-error 'unknown' is not a valid key
      const badKey: typeof gender.$keyType = 'unknown';

      expect([code, key]).toEqual([1, 'male']);
      expect([badCode, badKey]).toEqual([3, 'unknown']);
    });

    test('exported helpers infer code / key / item types', () => {
      const gender = eEnum({
        male: { code: 1, label: '男', tagColor: 'red' },
        female: { code: 2, label: '女', tagColor: 'blue' },
      });

      type Code = GetEnumCodeType<typeof gender>;
      type Key = GetEnumKeyType<typeof gender>;
      type Item = GetEnumItemType<typeof gender>;

      const code: Code = 2;
      const key: Key = 'female';
      const tag: Item['tagColor'] = 'red';

      // @ts-expect-error 9 is not a valid code
      const badCode: Code = 9;
      // @ts-expect-error 'cat' is not a valid key
      const badKey: Key = 'cat';

      expect([code, key, tag]).toEqual([2, 'female', 'red']);
      expect([badCode, badKey]).toEqual([9, 'cat']);
    });

    test('$valueType / $keyType are type-only and never pollute runtime', () => {
      const gender = eEnum({
        male: { code: 1 },
        female: { code: 2 },
      });

      expect('$valueType' in gender).toBe(false);
      expect('$keyType' in gender).toBe(false);
      expect(Object.keys(gender)).toEqual(['1', '2', 'male', 'female', '$list', '$map', '$options']);
      expect(JSON.stringify(gender)).not.toContain('$valueType');
    });

    test('$valueType / $keyType are reserved keys', () => {
      expect(() => eEnum({ $valueType: { code: 1 } })).toThrowError(
        'The built-in property "$valueType" cannot be used!'
      );
      expect(() => eEnum({ $keyType: { code: 1 } })).toThrowError(
        'The built-in property "$keyType" cannot be used!'
      );
    });
  });

  describe('type narrowing', () => {
    const gender = eEnum({
      male: { code: 1, label: '男', tagColor: 'red' },
      female: { code: 2, label: '女', tagColor: 'blue' },
    });

    test('$is narrows the item type', () => {
      const item = gender[1]!;

      if (item.$is('male')) {
        const tagColor: 'red' = item.tagColor;
        expect(tagColor).toBe('red');
      }

      if (item.$is('female')) {
        // @ts-expect-error narrowed to female, so tagColor is 'blue'
        const tagColor: 'red' = item.tagColor;
        expect(tagColor).toBe('blue');
      }
    });

    test('$eq narrows the item type', () => {
      const item = gender[1]!;

      if (item.$eq(2)) {
        const tagColor: 'blue' = item.tagColor;
        expect(tagColor).toBe('blue');
      }

      if (item.$eq(1)) {
        // @ts-expect-error narrowed to male, so tagColor is 'red'
        const tagColor: 'blue' = item.tagColor;
        expect(tagColor).toBe('red');
      }
    });

    test('$in narrows the item type to the union of the given keys', () => {
      const item = gender[1]!;

      if (item.$in(['male', 'female'])) {
        const tagColor: 'red' | 'blue' = item.tagColor;
        expect(tagColor).toBe('red');
      }

      if (item.$in([])) {
        // @ts-expect-error empty keys narrow the item to never
        const tagColor: 'red' | 'blue' = item.tagColor;
        expect(tagColor).toBeUndefined();
      }
    });

    test('code lookup keeps item methods', () => {
      expect(gender[1]?.$is('male')).toBe(true);
      expect(gender[2]?.$eq(2)).toBe(true);
      expect(gender[1]?.$in(['male'])).toBe(true);
      expect(gender[3]).toBeUndefined();
    });
  });

  describe('$map index', () => {
    test('passes the index of each item', () => {
      const data = {
        item1: { code: 'item1', $sort: 2 },
        item2: { code: 'item2', $sort: 1 },
        item3: { code: 'item3', $sort: 3 },
      };
      const enumObject = eEnum(data);

      const result = enumObject.$map((item, index) => {
        const checkedIndex: number = index;
        return `${checkedIndex}:${item.code}`;
      });

      expect(result).toEqual(['0:item2', '1:item1', '2:item3']);
    });
  });
});
