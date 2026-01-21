import { Search, Plus, Filter, MoreHorizontal, Mail, Phone, ExternalLink, TrendingUp, Sparkles, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/Dropdown';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { motion } from 'framer-motion';

const clients = [
    { id: 1, name: 'Jean Dupont', company: 'Tech Corp', status: 'Active', email: 'jean@tech.com', value: '12,500 €', avatar: 'JD', projects: 3 },
    { id: 2, name: 'Marie Curie', company: 'Science Lab', status: 'Lead', email: 'marie@science.edu', value: '5,000 €', avatar: 'MC', projects: 1 },
    { id: 3, name: 'Thomas Edison', company: 'Power Systems', status: 'Active', email: 'thomas@power.com', value: '25,000 €', avatar: 'TE', projects: 5 },
    { id: 4, name: 'Grace Hopper', company: 'Navy Tech', status: 'Inactive', email: 'grace@navy.mil', value: '3,200 €', avatar: 'GH', projects: 0 },
    { id: 5, name: 'Alan Turing', company: 'Enigma Solutions', status: 'Active', email: 'alan@enigma.com', value: '18,900 €', avatar: 'AT', projects: 2 },
];

const pipeline = [
    { stage: 'Prospects', count: 12, value: '45k €', color: 'from-blue-500 to-cyan-600', icon: Sparkles },
    { stage: 'Proposition', count: 5, value: '28k €', color: 'from-violet-500 to-purple-600', icon: TrendingUp },
    { stage: 'Négociation', count: 3, value: '15k €', color: 'from-amber-500 to-orange-600', icon: TrendingUp },
    { stage: 'Closing', count: 2, value: '10k €', color: 'from-emerald-500 to-teal-600', icon: TrendingUp },
];

export function Clients() {
    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h2 className="text-5xl font-bold tracking-tight mb-2">
                        <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                            Gestion Clients
                        </span>
                    </h2>
                    <p className="text-text-muted text-lg">
                        Suivez vos clients et votre pipeline commercial
                    </p>
                </div>
                <Button variant="primary" onClick={() => toast.success("Creation de client bientôt disponible !")}>
                    <Plus className="mr-2 h-4 w-4" /> Ajouter un client
                </Button>
            </motion.div>

            {/* Pipeline Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid gap-6 md:grid-cols-4"
            >
                {pipeline.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                    >
                        <Card hoverable className="group relative overflow-hidden bg-opacity-40 backdrop-blur-md">
                            {/* Gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                            {/* Icon background */}
                            <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <item.icon className="h-32 w-32" />
                            </div>

                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-text-muted uppercase tracking-widest">
                                    {item.stage}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-white font-display mb-1">
                                    {item.count}
                                </div>
                                <p className={`text-sm font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                                    {item.value}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {/* Clients Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card className="overflow-hidden bg-opacity-60 backdrop-blur-md">
                    {/* Table Header */}
                    <CardHeader className="flex flex-row items-center justify-between bg-surface-elevated/50 py-5 px-6 border-b border-border-subtle">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-80">
                                <Input
                                    placeholder="Filtrer par nom, entreprise..."
                                    leftIcon={<Search className="h-4 w-4" />}
                                    className="bg-surface border-border h-11"
                                />
                            </div>
                            <Button variant="outline" size="sm" className="h-11 text-text-secondary border-border" onClick={() => toast.info("Filtres avancés bientôt disponibles")}>
                                <Filter className="mr-2 h-4 w-4" /> Filtres
                            </Button>
                        </div>
                        <p className="text-sm text-text-subtle font-medium">{clients.length} clients trouvés</p>
                    </CardHeader>

                    {/* Table Content */}
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border-subtle text-text-subtle text-xs font-bold uppercase tracking-wider">
                                        <th className="px-6 py-4">Client</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Projets</th>
                                        <th className="px-6 py-4">Contact</th>
                                        <th className="px-6 py-4">Valeur Compte</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {clients.map((client, idx) => (
                                        <motion.tr
                                            key={client.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + idx * 0.05 }}
                                            className="group hover:bg-surface-elevated/30 transition-colors"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <Avatar
                                                        fallback={client.avatar}
                                                        className="h-11 w-11 ring-2 ring-border-subtle group-hover:ring-primary/40 transition-all text-sm font-bold"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                                                            {client.name}
                                                        </p>
                                                        <p className="text-xs text-text-subtle">{client.company}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <Badge
                                                    variant={client.status === 'Active' ? 'success' : client.status === 'Lead' ? 'warning' : 'neutral'}
                                                >
                                                    {client.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white">{client.projects}</span>
                                                    <span className="text-xs text-text-subtle">projets</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-text-subtle hover:text-primary hover:bg-primary/10"
                                                        onClick={() => toast.success(`Email sent to ${client.email}`)}
                                                    >
                                                        <Mail className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-text-subtle hover:text-primary hover:bg-primary/10"
                                                        onClick={() => toast.success(`Calling ${client.name}...`)}
                                                    >
                                                        <Phone className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-base font-bold text-white">
                                                    {client.value}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 text-text-secondary hover:text-white hover:bg-surface-hover"
                                                        onClick={() => toast.info(`Viewing details for ${client.name}`)}
                                                    >
                                                        <ExternalLink className="h-4 w-4 mr-2" /> Détails
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-text-subtle hover:text-white"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56">
                                                            <DropdownMenuItem icon={<Eye className="h-4 w-4" />} onClick={() => toast.info(`Viewing ${client.name}`)}>
                                                                Voir le profil
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem icon={<Pencil className="h-4 w-4" />} onClick={() => toast.success(`Editing ${client.name}`)}>
                                                                Modifier le client
                                                            </DropdownMenuItem>
                                                            <div className="h-px bg-border-subtle my-1" />
                                                            <DropdownMenuItem
                                                                destructive
                                                                icon={<Trash2 className="h-4 w-4" />}
                                                                onClick={() => toast.error(`Deleted ${client.name}`)}
                                                            >
                                                                Supprimer le client
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
