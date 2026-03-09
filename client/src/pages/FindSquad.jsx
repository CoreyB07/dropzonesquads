import React, { useState, useEffect } from 'react';
import SquadCard from '../components/SquadCard';
import ApplyModal from '../components/ApplyModal';
import SkeletonCard from '../components/SkeletonCard';
import { Search } from 'lucide-react';
import { fetchSquads as fetchSquadsFromDb } from '../utils/squadsApi';

const AUDIENCE_OPTIONS = [
    'Open to All',
    'Women Only',
    'Men Only'
];
const COMMS_OPTIONS = ['Game', 'Discord'];

const FindSquad = () => {
    const [squads, setSquads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSquad, setSelectedSquad] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState({
        gameMode: 'All Modes',
        platform: 'Any Platform',
        skillLevel: 'Any Skill',
        audience: 'Any Audience',
        comms: 'Any Comms'
    });
    const filterSelectClass = 'w-full bg-charcoal-dark text-white border border-military-gray p-2 rounded text-sm outline-none focus:border-tactical-yellow focus:ring-1 focus:ring-tactical-yellow/40';

    useEffect(() => {
        const loadSquads = async () => {
            try {
                const data = await fetchSquadsFromDb();
                setSquads(data);
            } catch (error) {
                console.error('Error fetching squads:', error);
                setSquads([]);
            } finally {
                setLoading(false);
            }
        };

        loadSquads();
    }, []);

    const filteredSquads = React.useMemo(() => {
        return squads.filter(squad => {
            const matchesSearch = squad.name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesMode = filter.gameMode === 'All Modes' || squad.gameMode === filter.gameMode;
            const matchesPlatform = filter.platform === 'Any Platform' || squad.platform === filter.platform;
            const matchesSkill = filter.skillLevel === 'Any Skill' || squad.skillLevel === filter.skillLevel;
            const squadAudience = squad.audience || 'Open to All';
            const matchesAudience = filter.audience === 'Any Audience' || squadAudience === filter.audience;
            const squadComms = squad.comms || 'Game';
            const matchesComms = filter.comms === 'Any Comms' || filter.comms === 'Game' && squadComms === 'Game' || squadComms === filter.comms;

            return matchesSearch && matchesMode && matchesPlatform && matchesSkill && matchesAudience && matchesComms;
        });
    }, [squads, searchTerm, filter]);

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Deployed Squads</h1>
                    <p className="text-gray-400 uppercase text-xs font-bold tracking-widest">Active listings in your region</p>
                </div>

                <div className="flex w-full md:w-auto gap-4">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search Squads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-charcoal-light border border-military-gray rounded-md py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-tactical-yellow outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <section className="bg-charcoal-light p-4 rounded-xl border border-military-gray grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Game Mode</label>
                    <select
                        value={filter.gameMode}
                        onChange={(e) => setFilter({ ...filter, gameMode: e.target.value })}
                        className={filterSelectClass}
                    >
                        <option className="bg-charcoal-dark text-white">All Modes</option>
                        <option className="bg-charcoal-dark text-white">Battle Royale</option>
                        <option className="bg-charcoal-dark text-white">Resurgence</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Platform</label>
                    <select
                        value={filter.platform}
                        onChange={(e) => setFilter({ ...filter, platform: e.target.value })}
                        className={filterSelectClass}
                    >
                        <option className="bg-charcoal-dark text-white">Any Platform</option>
                        <option className="bg-charcoal-dark text-white">PC</option>
                        <option className="bg-charcoal-dark text-white">PlayStation</option>
                        <option className="bg-charcoal-dark text-white">Xbox</option>
                        <option className="bg-charcoal-dark text-white">Crossplay</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Skill Level</label>
                    <select
                        value={filter.skillLevel}
                        onChange={(e) => setFilter({ ...filter, skillLevel: e.target.value })}
                        className={filterSelectClass}
                    >
                        <option className="bg-charcoal-dark text-white">Any Skill</option>
                        <option className="bg-charcoal-dark text-white">Casual</option>
                        <option className="bg-charcoal-dark text-white">Competitive</option>
                        <option className="bg-charcoal-dark text-white">Ranked</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Audience</label>
                    <select
                        value={filter.audience}
                        onChange={(e) => setFilter({ ...filter, audience: e.target.value })}
                        className={filterSelectClass}
                    >
                        <option className="bg-charcoal-dark text-white">Any Audience</option>
                        {AUDIENCE_OPTIONS.map((audience) => (
                            <option key={audience} className="bg-charcoal-dark text-white">{audience}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Comms</label>
                    <select
                        value={filter.comms}
                        onChange={(e) => setFilter({ ...filter, comms: e.target.value })}
                        className={filterSelectClass}
                    >
                        <option className="bg-charcoal-dark text-white">Any Comms</option>
                        {COMMS_OPTIONS.map((comms) => (
                            <option key={comms} className="bg-charcoal-dark text-white">{comms}</option>
                        ))}
                    </select>
                </div>
            </section>

            {/* Squad Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : filteredSquads.length > 0 ? (
                    filteredSquads.map((squad) => (
                        <SquadCard
                            key={squad.id}
                            squad={squad}
                            onJoin={(squad) => setSelectedSquad(squad)}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 text-gray-500 font-bold uppercase tracking-widest bg-charcoal-light/50 rounded-3xl border border-dashed border-military-gray">
                        No squads found matching your criteria
                    </div>
                )}
            </div>

            {selectedSquad && (
                <ApplyModal
                    squad={selectedSquad}
                    onClose={() => setSelectedSquad(null)}
                />
            )}
        </div>
    );
};

export default FindSquad;
