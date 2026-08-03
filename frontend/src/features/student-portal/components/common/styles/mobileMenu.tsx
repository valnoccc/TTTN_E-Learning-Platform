import styled from "styled-components";
import { colors } from "../element/elements";

export const Styles = styled.div`
.mobile-menu-area {
    background : ${colors.bg1};
    display: none;
    .mb-topbar {
        border-bottom: 1px solid ${colors.black2};
        align-items: center;

        .topbar-item {
            min-width: 0;
        }

        .topbar-item:first-child {
            flex: 1 1 auto;
        }

        .topbar-item:last-child {
            flex: 0 0 auto;
        }

        .mobile-account-actions {
            align-items: center;
            display: flex;
            gap: 8px;
        }

        .mobile-instructor-link {
            border: 1px solid ${colors.green};
            border-radius: 5px;
            color: ${colors.green};
            display: inline-block;
            font-size: 11px;
            font-weight: 600;
            padding: 4px 7px;
            white-space: nowrap;
        }
        .topbar-item {
            p {
                font-size: 13px;
                color: ${colors.text4};
                padding: 8px 0;
                i {
                    font-size: 16px;
                    color: ${colors.green};
                    vertical-align: text-top;
                    margin-right: 5px;
                }
            }
            ul {
                padding: 8px 0;
                li {
                    a {
                        font-size : 13px;
                        color : ${colors.green};
                        font-weight : 500;
                        text-transform : uppercase;
                        &:hover {
                            color : #ffffff;
                        }
                    }
                    &:nth-child(2) {
                        color : ${colors.text3};
                    }
                }
            }
        }
    }

    .mb-logo-area {
        align-items: center;
        gap: 10px;

        .mb-logo-box {
            min-width: 0;
            flex: 1 1 auto;
        }

        padding : 18px 0;
        .mb-logo-box {
            .hm-button {
                margin-top: 8px;
                margin-right: 35px;
                position: relative;
                &:before {
                    position: absolute;
                    content : "";
                    background : ${colors.text1};
                    width: 1px;
                    height: 25px;
                    top: -4px;
                    right: -16px;
                }
                a#mb-sidebar-btn {
                    i {
                        font-size : 20px;
                        color : ${colors.green};
                    }
                }

                @media(max-width: 480px) {
                    margin-top: 6px;
                    margin-right: 8px;
                    &:before {
                        content : none;
                    }
                }
            }
            .mb-logo {
                a {
                    img {
                        max-width: 150px;
                        @media(max-width: 480px) {
                            max-width : 120px;
                        }
                    }
                }
            }
        }

        .mb-search-box {
            flex: 0 0 150px;
            min-width: 0;

            form {
                width: 100%;
                position: relative;
                input {
                    width: 100%;
                    height: 35px;
                    border: 1px solid ${colors.text2};
                    background: transparent;
                    color : #ffffff;
                    border-radius: 5px;
                    padding-left: 15px;
                    padding-right: 40px;
                    font-size: 13px;
                    &::placeholder {
                        font-size : 12px;
                        color : ${colors.text3};
                    }
                    &:focus {
                        border-color : ${colors.green};
                    }

                    @media(max-width: 480px) {
                        max-width : 280px;
                    }

                    @media(max-width: 320px) {
                        display : none;
                    }
                }
                button {
                    position: absolute;
                    top: 0;
                    right: 0;
                    height: 100%;
                    width: 40px;
                    background: transparent;
                    border: none;
                    font-size: 16px;
                    color: ${colors.green};
                    i {

                    }

                    @media(max-width: 320px) {
                        display : none;
                    }
                }

                @media(max-width: 480px) {
                    max-width : none;
                }
            }
        }
    }

    @media(max-width: 480px) {
        .mb-topbar {
            gap: 8px;

            .topbar-item:first-child p {
                font-size: 11px;
                margin-bottom: 0;
                white-space: nowrap;
            }

            .mobile-auth-controls {
                gap: 5px !important;

                .backend-login-btn {
                    gap: 0 !important;
                    color: #ffffff !important;

                    span {
                        color: #ffffff !important;
                        display: inline-block;
                        font-size: 11px !important;
                        max-width: 58px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .icon-wrapper {
                        height: 30px !important;
                        width: 30px !important;
                    }
                }

                button:last-child {
                    font-size: 11px !important;
                    height: 28px !important;
                    padding: 4px 8px !important;
                }

                .backend-login-btn .icon-wrapper {
                    height: 28px !important;
                    width: 28px !important;
                }
            }

            .mobile-account-actions {
                gap: 5px;
            }

            .mobile-instructor-link {
                font-size: 10px;
                padding: 4px 5px;
            }
        }

        .mb-logo-area {
            .mb-search-box {
                flex-basis: 130px;
            }
        }
    }

    @media(max-width: 360px) {
        .mb-logo-area {
            gap: 6px;

            .mb-search-box {
                flex-basis: 112px;
            }

            .mb-search-box input,
            .mb-search-box button {
                display: block !important;
            }
        }
    }

    @media(min-width: 481px) and (max-width: 991px) {
        .mb-topbar {
            .topbar-item:first-child p {
                font-size: 12px;
                margin-bottom: 0;
            }

            .mobile-auth-controls {
                gap: 8px !important;

                .backend-login-btn {
                    color: #ffffff !important;
                    gap: 0 !important;

                    span {
                        color: #ffffff !important;
                        font-size: 12px !important;
                    }
                }

                button:last-child {
                    font-size: 12px !important;
                    height: 30px !important;
                    padding: 5px 12px !important;
                }
            }

            .mobile-account-actions {
                gap: 8px;
            }

            .mobile-instructor-link {
                font-size: 11px;
                padding: 5px 7px;
            }
        }

        .mb-logo-area {
            .mb-search-box {
                flex-basis: 190px;
            }
        }
    }

    @media(max-width: 991px) {
        display : block;
    }
}

.mb-sidebar {
    background: #ffffff;
    height: 100%;
    width: 320px;
    position: fixed;
    top : 0;
    left: -320px;
    overflow-y: auto;
    z-index: 9999;
    transition: all 400ms cubic-bezier(0.785,0.135,0.15,0.86);
    display: none;
    .mb-sidebar-heading {
        background: ${colors.gr_bg};
        padding: 25px;
        h5 {
            color: #ffffff;
            text-transform: uppercase;
        }
        a#close-mb-sidebar {
            i {
                font-size : 22px;
                color : #ffffff;
            }
        }
    }
    .mb-sidebar-menu {
        padding: 25px;
        .mb-menu-item {
            border-top: 1px solid ${colors.border1};
            &:last-child {
                border-bottom: 1px solid ${colors.border1};
            }
            button.mb-menu-button {
                border       : none;
                background   : transparent;
                display      : block;
                width        : 100%;
                padding      : 10px 0;
                text-align   : left;

                p {
                    font-size  : 14px;
                    color      : ${colors.black1};
                    text-transform: uppercase;
                    i {
                        font-size: 13px;
                        float: right;
                        border: 1px solid ${colors.border3};
                        border-radius: 25px;
                        padding: 3px;
                    }
                    &:hover {
                        color      : ${colors.green};
                        i {
                            border-color : ${colors.green};
                        }
                    }
                }
            }

            .mb-menu-content {
                max-height: 0;
                overflow  : hidden;
                transition: max-height 0.2s ease-in-out;

                ul {
                    li {
                        border-top: 1px solid ${colors.border1};
                        a {
                            font-size  : 13px;
                            color      : ${colors.black2};
                            display    : block;
                            padding    : 10px 0;
                            padding-left: 15px;
                            &:hover {
                                color      : ${colors.green};
                            }
                        }
                    }
                }
            }

            .mb-menu-content.show {
                max-height: 100%;
            }
        }
    }

    @media(max-width: 991px) {
        display : block;
    }

    @media(max-width: 480px) {
        max-width: 275px;
    }
}

.mb-sidebar.opened {
    left: 0 !important;
}

.mb-sidebar-overlay {
    position        : fixed;
    left            : 0;
    top             : 0;
    height          : 100%;
    width           : 100%;
    display         : block;
    background-color: rgba(0, 0, 0, 0.8);
    z-index         : 1111;
    visibility      : hidden;
    opacity         : 0;
    transition      : 0.3s ease;
}

.mb-sidebar-overlay.visible {
    visibility: visible;
    opacity   : 1;
}
`;
