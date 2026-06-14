import styled from "styled-components";
import { colors } from "../element/elements";

export const Styles = styled.div`
    a.nav-search {
        padding: 18px 0 0 10px;

        i {
            font-size: 20px;
            color    : ${colors.border1};
        }
    }

    .search-wrap {
        position        : fixed;
        top             : 0;
        left            : 0;
        width           : 100%;
        height          : 100%;
        z-index         : 999999;
        background-color: rgba(15, 23, 42, 0.95);
        backdrop-filter : blur(8px);
        transform       : scale(1, 0);
        transform-origin: bottom center;
        transition : transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);

        .search-overlay {
            width           : 100%;
            height          : 100%;
            background-color: transparent;
            position        : absolute;
            top             : 0;
            left            : 0;
            right           : 0;
            bottom          : 0;
            z-index         : 999;
        }

        .search-inner {
            position       : absolute;
            width          : 100%;
            height         : 100%;
            display        : flex;
            justify-content: center;
            align-items    : center;

            form.search-form {
                position  : relative;
                z-index   : 9991;
                width     : 50%;
                margin-top: -80px;
                position  : relative;

                input {
                    width        : 100%;
                    height       : 65px;
                    border       : none;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                    font-size    : 26px;
                    padding      : 0 10px 0 10px;
                    margin-bottom: 0;
                    color        : #ffffff;
                    position     : relative;
                    box-shadow   : none;
                    border-radius: 0;
                    outline      : none;
                    background   : transparent;
                    transition   : border-color 0.3s;

                    &:focus {
                        border-bottom: 2px solid ${colors.green};
                    }

                    &::placeholder {
                        font-style : italic;
                        color      : rgba(255, 255, 255, 0.5);
                        font-weight: 300;
                    }
                }

                .close-btn {
                    position : absolute;
                    top      : 25px;
                    right    : -12px;
                    font-size: 26px;
                    color    : rgba(255, 255, 255, 0.5);
                    cursor   : pointer;
                    transition: color 0.3s;

                    &:hover {
                        color: #ffffff;
                    }
                }
            }
        }
    }

    .search-wrap.active {
        transform-origin: top center;
        transform       : scale(1, 1);
    }
`;