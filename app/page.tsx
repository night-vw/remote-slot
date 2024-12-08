"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClinet_Compoent";

const RemoteSlot: React.FC = () => {
  const [slotNumbers, setSlotNumbers] = useState<number[]>([]); // 台番号リストを保持
  const [selectedSlotNum, setSelectedSlotNum] = useState<number | null>(null); // 選択された台番号
  const [slotSetting, setSlotSetting] = useState<number | null>(null); // スロットの設定
  const [slotStatus, setSlotStatus] = useState<string>(""); // スロットの状態
  const [selectedOption, setSelectedOption] = useState<string>(""); // ラジオボタンの選択

  interface SlotRemotePayload {
    slot_num: number;
    slot_running_flg: boolean;
    slot_status: string;
    [key: string]: any;
  }

  // データをフェッチする関数
  const fetchSlotNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from("slot_remote") // テーブル名
        .select("slot_num") // 取得する列
        .eq("slot_running_flg", true); // slot_running_flgがtrueの行に絞り込む
      if (error) throw error;

      const numbers = data
        .map((row: { slot_num: number }) => row.slot_num)
        .sort((a, b) => a - b); // 昇順ソート
      setSlotNumbers(numbers);
    } catch (error) {
      console.error("Error fetching slot numbers:", error);
    }
  };

  const fetchSlotSetting = async (slotNum: number) => {
    try {
      const { data, error } = await supabase
        .from("slot_remote")
        .select("slot_setting")
        .eq("slot_num", slotNum)
        .single();
      if (error) throw error;

      setSlotSetting(data?.slot_setting || null);
    } catch (error) {
      console.error("Error fetching slot setting:", error);
      setSlotSetting(null);
    }
  };

  const fetchSlotStatus = async (slotNum: number) => {
    try {
      const { data, error } = await supabase
        .from("slot_remote")
        .select("slot_status")
        .eq("slot_num", slotNum)
        .single();
      if (error) throw error;

      setSlotStatus(data?.slot_status || "不明");
    } catch (error) {
      console.error("Error fetching slot status:", error);
      setSlotStatus("エラー");
    }
  };

  const setupRealtimeListener = () => {
    const channel = supabase
      .channel("slot_remote")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "slot_remote" },
        (payload) => {
          const newData = payload.new as SlotRemotePayload;
          console.log("Change detected:", newData);
          fetchSlotNumbers();

          if (selectedSlotNum !== null && newData.slot_num === selectedSlotNum) {
            if (newData.slot_running_flg === false) {
              setSlotSetting(null);
              setSlotStatus("停止中");
            } else {
              fetchSlotSetting(selectedSlotNum);
              setSlotStatus(newData.slot_status || "不明");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    fetchSlotNumbers();
    const unsubscribe = setupRealtimeListener();
    return unsubscribe;
  }, [selectedSlotNum]);

  useEffect(() => {
    if (selectedSlotNum !== null) {
      fetchSlotSetting(selectedSlotNum);
      fetchSlotStatus(selectedSlotNum);
    }
  }, [selectedSlotNum]);

  const updateFlag = async () => {
    if (selectedSlotNum === null) {
      alert("台番号を選択してください");
      return;
    }
  
    if (!selectedOption) {
      alert("フラグを選択してください");
      return;
    }
  
    try {
      // 選択されたフラグに応じて更新する列を決定
      const updateData: {
        red_7_flg?: boolean;
        blue_7_flg?: boolean;
        yellow_7_flg?: boolean;
        bonus_continue_flg?: boolean;
        bonus_end_flg?: boolean;
        reset_flg?: boolean;
      } = {};
  
      switch (selectedOption) {
        case "赤7フラグ":
          updateData.red_7_flg = true;
          break;
        case "青7フラグ":
          updateData.blue_7_flg = true;
          break;
        case "黄7フラグ":
          updateData.yellow_7_flg = true;
          break;
        case "ボーナス継続":
          updateData.bonus_continue_flg = true;
          break;
        case "ボーナス終了":
          updateData.bonus_end_flg = true;
          break;
        case "強制リセットフラグ":
          updateData.reset_flg = true;
          break;
        default:
          alert("不明なフラグが選択されています");
          return;
      }
  
      // フラグを更新
      const { error: updateError } = await supabase
        .from("slot_remote")
        .update(updateData)
        .eq("slot_num", selectedSlotNum);
  
      if (updateError) {
        throw updateError;
      }
  
      alert(`${selectedOption}を設定しました！`);
      fetchSlotNumbers(); // 台番号リストを再取得
    } catch (error) {
      console.error("Error updating flags:", error);
      alert("フラグの更新に失敗しました");
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="w-full bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-4xl font-bold text-center text-gray-800">
            遠隔・ざ・ろっく
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-700">
          [稼働中の台番号]
        </h1>
        <div className="mt-4">
          <select
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedSlotNum || ""}
            onChange={(e) => setSelectedSlotNum(Number(e.target.value))}
          >
            <option value="" disabled>
              台番号を選択
            </option>
            {slotNumbers.map((slotNum) => (
              <option key={slotNum} value={slotNum}>
                {slotNum}
              </option>
            ))}
          </select>
        </div>

        <h1 className="text-xl md:text-2xl font-semibold text-gray-700 mt-8">
          [スロットの設定]
        </h1>
        <div className="mt-4">
          <p className="text-gray-600 text-xl">
            {slotSetting !== null
              ? `設定: ${slotSetting}`
              : "設定データがありません"}
          </p>
        </div>

        <div
          className={`mt-8 text-xl md:text-2xl font-semibold px-6 py-3 rounded-full shadow-md ${
            slotStatus === "通常ゲーム中"
            ? "bg-emerald-600 text-white"
            : slotStatus === "ボーナス前兆中"
            ? "bg-pink-700 text-white"
            : slotStatus === "ボーナスゲーム中"
            ? "bg-rose-500 text-white"
            : slotStatus === "継続ジャッジ中"
            ? "bg-indigo-800 text-white"
            : slotStatus === "ボーナスリザルト中"
            ? "bg-teal-700 text-white"
            : slotStatus === "ゲームリセット中" || slotStatus === "設定変更中"
            ? "bg-zinc-700 text-white"
            : slotStatus === "停止中"
            ? "bg-gray-500 text-white"
            : "bg-gray-500 text-white"
            }`}
            >
          現在は {slotStatus || "停止中"}
        </div>

        <h1 className="text-xl md:text-2xl font-semibold text-gray-700 mt-8">
          [強制フラグ選択]
        </h1>
        <div className="mt-4 text-xl">
  {/* 通常ゲーム中のときのみ表示 */}
  {slotStatus === "通常ゲーム中" && (
    <>
      <div>
        <label className="inline-flex items-center">
          <input
            type="radio"
            className="form-radio text-blue-500"
            name="赤7フラグ"
            value="赤7フラグ"
            checked={selectedOption === "赤7フラグ"}
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          <span className="ml-2 text-gray-700">赤7フラグ</span>
        </label>
      </div>
      <div className="mt-2">
        <label className="inline-flex items-center">
          <input
            type="radio"
            className="form-radio text-blue-500"
            name="青7フラグ"
            value="青7フラグ"
            checked={selectedOption === "青7フラグ"}
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          <span className="ml-2 text-gray-700">青7フラグ</span>
        </label>
      </div>
      <div className="mt-2">
        <label className="inline-flex items-center">
          <input
            type="radio"
            className="form-radio text-blue-500"
            name="黄7フラグ"
            value="黄7フラグ"
            checked={selectedOption === "黄7フラグ"}
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          <span className="ml-2 text-gray-700">黄7フラグ</span>
        </label>
      </div>
    </>
  )}

  {/* ボーナスゲーム中のときのみ表示 */}
  {slotStatus === "ボーナスゲーム中" && (
    <>
      <div>
        <label className="inline-flex items-center">
          <input
            type="radio"
            className="form-radio text-blue-500"
            name="ボーナス継続"
            value="ボーナス継続"
            checked={selectedOption === "ボーナス継続"}
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          <span className="ml-2 text-gray-700">ボーナス継続</span>
        </label>
      </div>
      <div className="mt-2">
        <label className="inline-flex items-center">
          <input
            type="radio"
            className="form-radio text-blue-500"
            name="ボーナス終了"
            value="ボーナス終了"
            checked={selectedOption === "ボーナス終了"}
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          <span className="ml-2 text-gray-700">ボーナス終了</span>
        </label>
      </div>
    </>
  )}


  {/* 停止中以外で強制リセットフラグを表示 */}
  {slotStatus !== "停止中" && slotStatus !== "" && slotStatus !== "ボーナスリザルト中"&& slotStatus !== "ゲームリセット中"&& slotStatus !== "設定変更中" && (
    <div className="mt-8">
      <label className="inline-flex items-center">
        <input
          type="radio"
          className="form-radio text-blue-500"
          name="強制リセットフラグ"
          value="強制リセットフラグ"
          checked={selectedOption === "強制リセットフラグ"}
          onChange={(e) => setSelectedOption(e.target.value)}
        />
        <span className="ml-2 text-gray-700">強制リセットフラグ</span>
      </label>
    </div>
  )}
</div>


      {slotStatus !== "停止中" && slotStatus !== "" && slotStatus !== "ボーナスリザルト中"&& slotStatus !== "ゲームリセット中"&& slotStatus !== "設定変更中" && (
        <div className="mt-4">
          <button
            className="px-6 py-3 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={updateFlag}
            >
          決定
          </button>
        </div>
      )}
      </main>
    </div>
  );
};

export default RemoteSlot;
