import styled from '@emotion/styled';
import { typography } from 'Elements/cssMixins';
import { Input } from 'Elements/Input';
import { nextIndex } from 'Elements/Switcher';
import {
    ForwardedRef,
    forwardRef,
    KeyboardEventHandler,
    ReactNode,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import styles from 'Scenes/Game/Singing/GameOverlay/Drawing/styles';

interface Props {
    focused: boolean;
    label: ReactNode;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    options: string[];
    placeholder?: string;
}

export const Autocomplete = forwardRef(
    (
        { options, focused, label, value, onChange, disabled, placeholder, ...restProps }: Props,
        forwardedRef: ForwardedRef<HTMLInputElement | null>,
    ) => {
        const inputRef = useRef<HTMLInputElement>(null);
        useImperativeHandle(forwardedRef, () => inputRef.current!);

        const autocompleteMenu = useRef<HTMLDivElement>(null);

        const [isInputFocused, setIsInputFocused] = useState(false);
        const [focusedOption, setFocusedOption] = useState(-1);

        const filteredOptions = useMemo(
            () =>
                options.filter(
                    (option) => option.toLowerCase().trim().includes(value.toLowerCase().trim()) && option !== value,
                ),
            [options, value],
        );

        const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
            if (filteredOptions.length && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) {
                e.preventDefault();
                const newIndex = nextIndex(filteredOptions, focusedOption, e.code === 'ArrowUp' ? -1 : 1);
                setFocusedOption(newIndex);

                const option = autocompleteMenu.current?.querySelector(`[data-index="${newIndex}"]`) as HTMLDivElement;

                option?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (e.code === 'Enter') {
                const option = filteredOptions[focusedOption];
                if (option) {
                    setFocusedOption(-1);
                    onChange(option);
                } else {
                    inputRef.current?.blur();
                }
            }
        };

        return (
            <Container>
                <Input
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setTimeout(() => setIsInputFocused(false), 300)}
                    onKeyDown={handleKeyDown}
                    onChange={onChange}
                    value={value}
                    focused={focused}
                    label={label}
                    disabled={disabled}
                    ref={inputRef}
                    placeholder={placeholder}
                />
                {isInputFocused && !!filteredOptions.length && (
                    <AutocompleteMenu ref={autocompleteMenu}>
                        {filteredOptions.map((option, index) => (
                            <AutocompleteMenuitem
                                data-index={index}
                                key={option}
                                focused={index === focusedOption}
                                onClick={() => {
                                    onChange(option);
                                    setFocusedOption(-1);
                                    inputRef.current?.blur();
                                }}>
                                {option}
                            </AutocompleteMenuitem>
                        ))}
                    </AutocompleteMenu>
                )}
            </Container>
        );
    },
);

const Container = styled.div`
    position: relative;
`;

const AutocompleteMenu = styled.div`
    margin-top: 0.1em;
    position: absolute;
    width: 100%;
    background: black;
    max-height: ${(1 + 2 * 0.3) * 4}em;
    overflow-y: auto;
    z-index: 2;
`;

const AutocompleteMenuitem = styled.div<{ focused: boolean }>`
    ${typography};
    padding: 0.3em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: ${(props) => (props.focused ? styles.colors.text.active : 'white')};
    cursor: pointer;
`;
