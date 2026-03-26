import { useEffect, useState } from 'react';
import CampaignList from '@/components/campaign/campaign-list';
import { SortOrder, MappedPaginatorInfo } from '@/types';

const CampaignPage = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [paginatorInfo, setPaginatorInfo] = useState<MappedPaginatorInfo | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [orderBy, setOrderBy] = useState('created_at');
    const [sortedBy, setSortedBy] = useState<SortOrder>(SortOrder.Desc);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/campaigns?page=${currentPage}&orderBy=${orderBy}&sortedBy=${sortedBy}`
            );

            const data = await res.json();

            // 🔥 IMPORTANT : adapte selon ton backend
            setCampaigns(data.data || data);

            setPaginatorInfo({
                total: data.total || 0,
                currentPage: data.currentPage || 1,
                perPage: data.perPage || 10,
            });

        } catch (error) {
            console.error('Erreur fetch campaigns:', error);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [currentPage, orderBy, sortedBy]);

    const handlePagination = (page: number) => {
        setCurrentPage(page);
    };

    const handleSort = (fn: any) => {
        setSortedBy(fn(sortedBy));
    };

    const handleOrder = (column: string) => {
        setOrderBy(column);
    };

    return (
        <div className="p-6">
            <CampaignList
                campaigns={campaigns}
                paginatorInfo={paginatorInfo}
                onPagination={handlePagination}
                onSort={handleSort}
                onOrder={handleOrder}
            />
        </div>
    );
};

export default CampaignPage;