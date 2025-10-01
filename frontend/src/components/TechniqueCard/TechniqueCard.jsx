import './TechniqueCard.css';

function TechniqueCard({ technique, onSelect }) {
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Beginner':
                return '#4caf50';
            case 'Intermediate':
                return '#ff9800';
            case 'Advanced':
                return '#f44336';
            default:
                return '#999';
        }
    };

    return (
        <div className="technique-card" onClick={() => onSelect(technique)}>
            <div className="technique-header">
                <h3>{technique.name}</h3>
                <span
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(technique.difficulty) }}
                >
                    {technique.difficulty}
                </span>
            </div>

            <p className="technique-style">🥋 {technique.style}</p>

            <p className="technique-description">
                {technique.description}
            </p>

            <button className="practice-btn">
                Practice This Technique →
            </button>
        </div>
    );
}

export default TechniqueCard;