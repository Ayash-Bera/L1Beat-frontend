import { useState } from 'react';
import { ICTT, PoweredByAvalanche } from '@0xstt/builderkit';
import { Info } from 'lucide-react';
import './Bridge.css';
import { CHAINS, TOKENS } from '../../utils/constants';

function Bridge() {

  return (
    <div className="grid grid-cols-12 text-white text-sm items-center">
      <div className="col-span-12 flows-bg w-full h-screen">
        <div className="flex flex-col w-full h-full justify-center items-center gap-4">
          <ICTT 
            tokens={TOKENS} 
            token_in="native" 
            source_chain_id={43113} 
            destination_chain_id={173750}
          />
          <a className="flex items-center gap-2 text-white hover:underline" 
             href="https://academy.avax.network/course/interchain-token-transfer" 
             target="_blank" 
             rel="noopener noreferrer">
            <Info size={16} />
            <p className="text-xs">What is ICTT?</p>
          </a>
          <a className="w-[120px]" 
             href="https://subnets.avax.network/" 
             target="_blank" 
             rel="noopener noreferrer">
            <PoweredByAvalanche className="w-full h-full" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default Bridge;
