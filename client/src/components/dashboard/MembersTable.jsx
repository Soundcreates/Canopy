import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MagicCard } from './MagicBento';

const StatusBadge = ({ status }) => {
    const styles = {
        ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        INACTIVE: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    const style = styles[status] || styles.ACTIVE;

    return (
        <span className={`px-2 py-0.5 text-[10px] font-mono border rounded uppercase tracking-wider ${style}`}>
            {status}
        </span>
    );
};

const MembersTable = () => {
    // Mock data for organization members
    const [members, setMembers] = useState([
        {
            id: 'USR-001',
            name: 'Alex Creator',
            role: 'OWNER',
            forestsRegistered: 12,
            verifiedArea: 4500.50,
            carbonCredits: 120000,
            status: 'ACTIVE',
            image: 'https://i.pravatar.cc/150?u=a042581f4e29026024d'
        },
        {
            id: 'USR-002',
            name: 'Sarah Researcher',
            role: 'MEMBER',
            forestsRegistered: 5,
            verifiedArea: 1250.20,
            carbonCredits: 45000,
            status: 'ACTIVE',
            image: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
        },
        {
            id: 'USR-003',
            name: 'Mike Field',
            role: 'MEMBER',
            forestsRegistered: 2,
            verifiedArea: 320.00,
            carbonCredits: 8500,
            status: 'PENDING',
            image: 'https://i.pravatar.cc/150?u=a04258114e29026302d'
        }
    ]);

    return (
        <MagicCard
            enableStars={false}
            className="!p-0 !bg-[#11141a]/80 !h-fit"
            enableTilt={false}
            setHeight={400}
        >
            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center relative z-10">
                <h3 className="text-sm font-medium text-white">Organization Members</h3>
                <div className="flex gap-4">
                    <div className="text-xs text-gray-500 font-mono">
                        TOTAL MEMBERS: <span className="text-white">{members.length}</span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto relative z-10 min-h-[200px] scrollbar-hide">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/[0.02] text-xs font-mono text-gray-500 uppercase">
                            <th className="px-5 py-3 font-normal">Member</th>
                            <th className="px-5 py-3 font-normal">Role</th>
                            <th className="px-5 py-3 font-normal text-right">Forests</th>
                            <th className="px-5 py-3 font-normal text-right">Area (ha)</th>
                            <th className="px-5 py-3 font-normal text-right">Carbon (t)</th>
                            <th className="px-5 py-3 font-normal text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {members.map((member, i) => (
                            <motion.tr
                                key={member.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="hover:bg-white/[0.02] transition-colors group"
                            >
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-white/10">
                                            {member.image ? (
                                                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-mono">
                                                    {member.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-200 group-hover:text-emerald-400 transition-colors">{member.name}</div>
                                            <div className="text-[10px] text-gray-500 font-mono">{member.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3 font-mono text-xs">
                                    <span className={`px-1.5 py-0.5 rounded ${member.role === 'OWNER'
                                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                            : 'text-gray-400'
                                        }`}>
                                        {member.role}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right text-gray-300 font-mono">
                                    {member.forestsRegistered}
                                </td>
                                <td className="px-5 py-3 text-right text-gray-300 font-mono">
                                    {member.verifiedArea.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-5 py-3 text-right text-white font-medium font-mono">
                                    {member.carbonCredits.toLocaleString()}
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <StatusBadge status={member.status} />
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </MagicCard>
    );
};

export default MembersTable;
