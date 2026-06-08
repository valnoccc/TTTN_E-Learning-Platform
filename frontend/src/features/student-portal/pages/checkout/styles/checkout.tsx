import styled from "styled-components";
import { colors } from "../../../components/common/element/elements";

export const Styles = styled.div`
    .checkout-page {
        padding: 60px 0;
        background-color: #f8f9fa;

        .card-box {
            background: #fff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            margin-bottom: 30px;

            h4.title {
                font-size: 20px;
                color: ${colors.black1};
                font-weight: 600;
                margin-bottom: 25px;
                border-bottom: 1px solid ${colors.border1};
                padding-bottom: 15px;
            }
        }

        /* Billing Form */
        form.billing-form {
            .form-control {
                height: 50px;
                border-radius: 8px;
                border: 1px solid ${colors.border3};
                box-shadow: none;
                margin-bottom: 20px;
                &:focus {
                    border-color: ${colors.green};
                }
            }
            label {
                font-weight: 500;
                margin-bottom: 8px;
                color: ${colors.text1};
            }
        }

        /* Payment Methods */
        .payment-methods {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;

            .payment-card {
                border: 2px solid ${colors.border1};
                border-radius: 8px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;

                img {
                    width: 30px;
                    height: 30px;
                    object-fit: contain;
                }

                span {
                    font-weight: 500;
                    color: ${colors.black2};
                }

                &:hover {
                    border-color: ${colors.green};
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                }

                &.selected {
                    border-color: ${colors.green};
                    background-color: rgba(30, 190, 165, 0.05);
                    position: relative;

                    &::after {
                        content: '\\f058';
                        font-family: 'Line Awesome Free';
                        font-weight: 900;
                        color: ${colors.green};
                        position: absolute;
                        right: 15px;
                        font-size: 20px;
                    }
                }
            }
        }

        /* Bank Transfer Details */
        .bank-details {
            margin-top: 25px;
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            display: flex;
            gap: 20px;
            align-items: center;

            .qr-code {
                width: 120px;
                height: 120px;
                background: #fff;
                padding: 10px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                img {
                    width: 100%;
                    height: 100%;
                }
            }

            .info {
                p {
                    margin-bottom: 5px;
                    color: ${colors.text2};
                    strong {
                        color: ${colors.black1};
                    }
                }
            }
        }

        /* Order Summary */
        .order-summary {
            .course-info {
                display: flex;
                gap: 15px;
                margin-bottom: 25px;
                padding-bottom: 25px;
                border-bottom: 1px solid ${colors.border1};

                img {
                    width: 80px;
                    height: 80px;
                    border-radius: 8px;
                    object-fit: cover;
                }

                .details {
                    h6 {
                        font-size: 16px;
                        line-height: 1.4;
                        margin-bottom: 8px;
                    }
                    p {
                        font-size: 13px;
                        color: ${colors.text3};
                        margin: 0;
                    }
                }
            }

            .price-list {
                margin-bottom: 25px;
                li {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 15px;
                    color: ${colors.text2};
                    font-size: 15px;

                    &.total {
                        font-size: 18px;
                        font-weight: 600;
                        color: ${colors.green};
                        border-top: 1px solid ${colors.border1};
                        padding-top: 15px;
                        margin-top: 5px;
                    }

                    &.discount {
                        color: ${colors.red};
                    }
                }
            }

            .coupon-box {
                display: flex;
                gap: 10px;
                margin-bottom: 25px;

                input {
                    flex: 1;
                    height: 45px;
                    border-radius: 6px;
                    border: 1px solid ${colors.border3};
                    padding: 0 15px;
                    &:focus {
                        border-color: ${colors.green};
                    }
                }

                button {
                    height: 45px;
                    padding: 0 20px;
                    background: ${colors.black1};
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    font-weight: 500;
                    transition: all 0.3s;
                    &:hover {
                        background: ${colors.green};
                    }
                    &:disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                    }
                }
            }

            .confirm-btn {
                width: 100%;
                height: 55px;
                background: ${colors.green};
                color: #fff;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                text-transform: uppercase;
                transition: all 0.3s;
                
                &:hover {
                    background: ${colors.gr_bg2};
                }
                
                &:disabled {
                    background: ${colors.border3};
                    cursor: not-allowed;
                }
            }
        }
    }
`;
