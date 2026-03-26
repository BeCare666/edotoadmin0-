import UserListIndex from '@/components/message/user-list-index';
import UserMessageIndex from '@/components/message/user-message-index';
import Card from '@/components/common/card';
import { useWindowSize } from '@/utils/use-window-size';
import ResponsiveView from '@/components/message/views/responsive-vew';
import { RESPONSIVE_WIDTH } from '@/utils/constants';

export default function MessagePageIndex() {
  const { width } = useWindowSize();
  return (
    <>
      <div
        className="h-full overflow-hidden"
        style={{ maxHeight: 'calc(100% - 5px)' }}
      >
        {width >= RESPONSIVE_WIDTH ? (
          <div className="flex h-full flex-wrap gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden">
            <UserListIndex className="card-premium rounded-l-2xl border-r border-gray-100" />
            <UserMessageIndex className="flex-1 min-w-0 rounded-r-2xl bg-gray-50/50" />
          </div>
        ) : (
          <ResponsiveView />
        )}
      </div>
    </>
  );
}
