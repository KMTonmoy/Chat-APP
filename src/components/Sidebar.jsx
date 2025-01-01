import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const Sidebar = () => {
    const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
    const [messageData, setMessageData] = useState([]);
    const { authUser, checkAuth } = useAuthStore();
    const myID = authUser._id;

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        fetch('http://localhost:8000/allMessages')
            .then(response => response.json())
            .then(json => setMessageData(json));
    }, []);

    const { onlineUsers } = useAuthStore();
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);

    useEffect(() => {
        getUsers(); // Fetch all users once
    }, [getUsers]);

    const [searchQuery, setSearchQuery] = useState(""); // State for the search query

    // Default filter for users who have messages with current user (myID)
    const usersWithMessages = messageData
        .filter(message => message.senderId === myID || message.receiverId === myID)
        .map(message => message.senderId === myID ? message.receiverId : message.senderId);

    const uniqueUserIdsWithMessages = [...new Set(usersWithMessages)];

    // Filter users based on search query
    const filteredUsers = users
        .filter((user) => {
            const matchesSearch =
                user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());

            // If there's a search query, don't check for messages with myID, just search by name/email
            if (searchQuery) {
                return matchesSearch;
            }

            // If there's no search query, check for messages with myID
            return uniqueUserIdsWithMessages.includes(user._id) && matchesSearch;
        })
        .filter((user) =>
            showOnlineOnly
                ? onlineUsers.includes(user._id) // Filter online users if enabled
                : true
        );

    if (isUsersLoading) return <SidebarSkeleton />;

    return (
        <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
            <div className="border-b border-base-300 w-full p-5">
                <div className="flex items-center gap-2">
                    <Users className="size-6" />
                    <span className="font-medium hidden lg:block">Contacts</span>
                </div>

                {/* Search Input */}
                <div className="mt-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email"
                        className="input input-sm w-full"
                    />
                </div>

                <div className="mt-3 hidden lg:flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={showOnlineOnly}
                            onChange={(e) => setShowOnlineOnly(e.target.checked)}
                            className="checkbox checkbox-sm"
                        />
                        <span className="text-sm">Show online only</span>
                    </label>
                    <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
                </div>
            </div>

            <div className="overflow-y-auto w-full py-3">
                {filteredUsers.map((user) => (
                    <button
                        key={user._id}
                        onClick={() => setSelectedUser(user)}
                        className={`
                            w-full p-3 flex items-center gap-3
                            hover:bg-base-300 transition-colors
                            ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                        `}
                    >
                        <div className="relative mx-auto lg:mx-0">
                            <img
                                src={user.profilePic || "/avatar.png"}
                                alt={user.name}
                                className="size-12 object-cover rounded-full"
                            />
                            {onlineUsers.includes(user._id) && (
                                <span
                                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                                    rounded-full ring-2 ring-zinc-900"
                                />
                            )}
                        </div>

                        <div className="hidden lg:block text-left min-w-0">
                            <div className="font-medium truncate">{user.fullName}</div>
                            <div className="text-sm text-zinc-400">
                                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                            </div>
                        </div>
                    </button>
                ))}

                {filteredUsers.length === 0 && (
                    <div className="text-center text-zinc-500 py-4">No users to show</div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
