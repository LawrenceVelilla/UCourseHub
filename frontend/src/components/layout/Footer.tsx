

const Footer = () => {
    return (
        <footer className="border-t bg-card">
            <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                <p>
                    &copy; {new Date().getFullYear()} UCourseHub. No affiliation with the University of Alberta, and is a personal project by Lawrence Velilla.
                </p>
            </div>
            {/* TODO: Add links to GitHub, LinkedIn, and Portfolio */}
            <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                <p>
                    <a href="https://github.com/LawrenceVelilla" target="_blank" rel="noopener noreferrer">
                        GitHub
                    </a>
                    {' '}
                    <a href="https://www.linkedin.com/in/lawrencevelilla" target="_blank" rel="noopener noreferrer">
                        LinkedIn
                    </a>
                    {' '}
                    <a href="https://lawrencevelilla.com" target="_blank" rel="noopener noreferrer">
                        Portfolio
                    </a>
                </p>
            </div>
        </footer>
    );
};

export default Footer;