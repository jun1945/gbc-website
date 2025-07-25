import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

const GBC_TOKEN_ADDRESS = "0xBAf4aC7432e0404dB789A0EAbe13168AF02a288B";
const GBC_ABI = [
  "function balanceOf(address) view returns (uint)",
  "function transfer(address to, uint amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

export default function GBCSwapSite() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [ethAmount, setEthAmount] = useState("0.01");
  const [gbcAmount, setGbcAmount] = useState("0");

  const GBC_RATE = 100000;

  useEffect(() => {
    const calculated = parseFloat(ethAmount) * GBC_RATE;
    setGbcAmount(calculated.toFixed(0));
  }, [ethAmount]);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask 또는 Web3 지갑이 필요합니다");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const account = await signer.getAddress();
    setProvider(provider);
    setSigner(signer);
    setAccount(account);
    fetchBalance(provider, account);
  };

  const fetchBalance = async (provider, address) => {
    const token = new ethers.Contract(GBC_TOKEN_ADDRESS, GBC_ABI, provider);
    const decimals = await token.decimals();
    const bal = await token.balanceOf(address);
    setBalance(ethers.utils.formatUnits(bal, decimals));
  };

  const swapETHForGBC = async () => {
    if (!signer) return;
    const tx = await signer.sendTransaction({
      to: "0xYourOwnerWalletAddress",
      value: ethers.utils.parseEther(ethAmount)
    });
    await tx.wait();

    const token = new ethers.Contract(GBC_TOKEN_ADDRESS, GBC_ABI, signer);
    const decimals = await token.decimals();
    const amountToSend = ethers.utils.parseUnits(gbcAmount, decimals);
    const transferTx = await token.transfer(account, amountToSend);
    await transferTx.wait();

    alert("스왑 완료! GBC가 지갑에 전송되었습니다.");
    fetchBalance(provider, account);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">광복코인(GBC) 비상장 판매</h1>
      {!account ? (
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={connectWallet}>
          지갑 연결
        </button>
      ) : (
        <>
          <p className="mb-2">연결된 지갑: {account}</p>
          <p className="mb-2">보유 GBC: {balance}</p>
          <div className="my-4">
            <label className="block mb-1">ETH 입력 (판매 단가 기준 1ETH ≒ {GBC_RATE} GBC):</label>
            <input
              type="number"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              className="border p-2 w-full"
            />
          </div>
          <p className="mb-4">→ 받을 GBC 예상: <strong>{gbcAmount} GBC</strong></p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={swapETHForGBC}>
            스왑 실행 (ETH → GBC)
          </button>
        </>
      )}
    </div>
  );
}
