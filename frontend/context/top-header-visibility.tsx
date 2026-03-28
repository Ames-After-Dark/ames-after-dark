import React from 'react';

type TopHeaderVisibilityContextValue = {
    topHeaderVisible: boolean;
    setTopHeaderVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const TopHeaderVisibilityContext = React.createContext<TopHeaderVisibilityContextValue | null>(null);

export function TopHeaderVisibilityProvider({ children }: { children: React.ReactNode }) {
    const [topHeaderVisible, setTopHeaderVisible] = React.useState(true);

    const value = React.useMemo(
        () => ({ topHeaderVisible, setTopHeaderVisible }),
        [topHeaderVisible]
    );

    return (
        <TopHeaderVisibilityContext.Provider value={value}>
            {children}
        </TopHeaderVisibilityContext.Provider>
    );
}

export function useTopHeaderVisibility() {
    const context = React.useContext(TopHeaderVisibilityContext);

    if (!context) {
        throw new Error('useTopHeaderVisibility must be used within TopHeaderVisibilityProvider');
    }

    return context;
}
