import React from 'react';

interface AddNewSiteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddNewSiteModal: React.FC<AddNewSiteModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <dialog open style={modalStyle}>
            <h2>Add New Site</h2>
            <form>
                <input type="text" placeholder="Site Name" />
                <input type="text" placeholder="Site URL" />
                <button type="submit">Add Site</button>
            </form>
            <button onClick={onClose}>Close</button>
        </dialog>
    );
};

// CSS styles for the modal
const modalStyle: React.CSSProperties = {
    border: '2px solid #ccc', // Border style
    borderRadius: '8px',      // Rounded corners
    padding: '20px',          // Padding inside the modal
    width: '400px',           // Width of the modal
    maxWidth: '90%',          // Responsive max width
    margin: 'auto',           // Center the modal
    display: 'flex',          // Flexbox for layout
    flexDirection: 'column',  // Column layout
    alignItems: 'center',     // Center items horizontally
};

export default AddNewSiteModal; 