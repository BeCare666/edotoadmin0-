import 'rc-table/assets/index.css';
import RcTable from 'rc-table';
import React from 'react';

export type AlignType = 'left' | 'center' | 'right';

interface TableProps {
    data?: any[];
    columns: any[];
    [key: string]: any;
}

const Table: React.FC<TableProps> = ({ data, columns, ...props }) => {
    // ✅ Garantir que data est toujours un tableau
    const safeData = Array.isArray(data) ? data : [];

    return <RcTable data={safeData} columns={columns} {...props} />;
};

export { Table };
