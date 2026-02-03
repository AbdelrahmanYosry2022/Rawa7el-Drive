
const mockStore = {
  students: [],
  attendance: []
};

const mockSupabase = {
  from: (table) => {
    let queryData = [...(mockStore[table] || [])];
    let selectOptions = null;
    let currentOp = 'select';

    const chain = {
      select: (columns = '*', options) => {
        currentOp = 'select';
        selectOptions = options || null;
        return chain;
      },
      eq: (column, value) => {
        queryData = queryData.filter((item) => item[column] === value);
        return chain;
      },
      insert: async (data) => {
        const items = Array.isArray(data) ? data : [data];
        if (!mockStore[table]) mockStore[table] = [];
        mockStore[table].push(...items);
        return { data: items, error: null };
      },
      delete: () => {
        currentOp = 'delete';
        return chain;
      },
      then: (resolve) => {
        if (currentOp === 'delete') {
            // simplified delete for test
            resolve({ data: [], error: null });
        } else {
            let resultCount = null;
            if (selectOptions?.count) {
              resultCount = queryData.length;
            }
            let resultData = queryData;
            if (selectOptions?.head) {
              resultData = [];
            }
            resolve({ data: resultData, count: resultCount, error: null });
        }
      }
    };
    return chain;
  }
};

async function test() {
  // 1. Insert records
  await mockSupabase.from('attendance').insert([
    { id: 1, date: '2024-01-28', status: 'present' },
    { id: 2, date: '2024-01-28', status: 'absent' },
    { id: 3, date: '2024-01-29', status: 'present' }
  ]);

  // 2. Query with filters and count
  const result = await new Promise(resolve => {
    mockSupabase.from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('date', '2024-01-28')
      .eq('status', 'present')
      .then(resolve);
  });

  console.log('Result:', result);
  
  if (result.count === 1) {
      console.log('PASS: Count is 1');
  } else {
      console.log('FAIL: Count is ' + result.count);
  }
}

test();
