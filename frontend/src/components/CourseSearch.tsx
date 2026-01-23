import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CourseSearchProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

const CourseSearch = ({ onSearch, placeholder = "Search courses (e.g., CMPUT 200)" }: CourseSearchProps) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-xl gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="pl-10 shadow-earth transition-shadow focus:shadow-earth-lg"
                />
            </div>
            <Button type="submit" className="shadow-earth">
                Search
            </Button>
        </form>
    );
};

export default CourseSearch;
