import React, { useEffect } from 'react';
import { Styles } from '../styles/quantity';

function Quantity() {
    useEffect(() => {
        const plus = document.getElementById("plus") as HTMLInputElement | null;
        const minus = document.getElementById("minus") as HTMLInputElement | null;
        const input = document.getElementById("count") as HTMLInputElement | null;

        if (!plus || !minus || !input) {
            return;
        }

        const increase = () => {
            const nextValue = Number.parseInt(input.value, 10) + 1;
            input.value = `${nextValue}`;
        };

        const decrease = () => {
            const currentValue = Number.parseInt(input.value, 10);
            if (currentValue > 1) {
                input.value = `${currentValue - 1}`;
            }
        };

        plus.addEventListener("click", increase);
        minus.addEventListener("click", decrease);

        return () => {
            plus.removeEventListener("click", increase);
            minus.removeEventListener("click", decrease);
        };
    }, []);

    return (
        <Styles>
            <div className="product-qty">
                <ul className="list-unstyled list-inline">
                    <li className="list-inline-item">Qty :</li>
                    <li className="list-inline-item" id="qty-input">
                        <input type="button" defaultValue="-" id="minus" />
                        <input type="text" defaultValue="1" id="count" />
                        <input type="button" defaultValue="+" id="plus" />
                    </li>
                </ul>
            </div>
        </Styles>
    )
}

export default Quantity
