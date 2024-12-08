'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClinet_Compoent';

const SupabaseUpdateMonitor = () => {
  const [updateData, setUpdateData] = useState<{ old: any; new: any } | null>(null);

  // 監視したいMACアドレスを指定
  const targetMacAddress = 'D8:BB:C1:A5:D6:BA'; // 対象のMACアドレスに置き換え

  useEffect(() => {
    // リアルタイムのデータ監視
    const subscription = supabase
      .channel('realtime:public:slot_remote') // チャンネル名を適切に命名
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'slot_remote',
        },
        (payload) => {
          // MACアドレスの条件をチェック
          if (payload.new?.mac_address === targetMacAddress) {
            setUpdateData({
              old: payload.old,
              new: payload.new,
            });
          }
        }
      )
      .subscribe();

    // コンポーネントのクリーンアップ時にチャンネルを解除
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Update Monitor</h1>
      {updateData ? (
        <div className="mt-4">
          <p className="text-gray-700">
            <strong>変更前データ:</strong> {JSON.stringify(updateData.old, null, 2)}
          </p>
          <p className="text-gray-700">
            <strong>変更後データ:</strong> {JSON.stringify(updateData.new, null, 2)}
          </p>
        </div>
      ) : (
        <p className="text-gray-500">更新を監視中...</p>
      )}
    </div>
  );
};

export default SupabaseUpdateMonitor;
