let ioInstance;

module.exports = {
    setIO: (io) => {
        ioInstance = io;
    },
    getIO: () => {
        return ioInstance;
    },
    to: (room) => {
        if (ioInstance) {
            return ioInstance.to(room);
        }
        return { emit: () => {} }; // Dummy if not initialized
    }
};
