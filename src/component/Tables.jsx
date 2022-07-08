import React, {useEffect, useRef, useState} from 'react';
import PostService from "../API/PostService";
import moment from "moment/moment";
import {SearchOutlined} from '@ant-design/icons';
import {Button, Input, Space, Table} from 'antd';
import Highlighter from 'react-highlight-words';
import './Tables.module.css'
import classes from "./Tables.module.css";

const Tables = () => {
    useEffect(() => {
        async function getResponse() {
            setLoading(true)
            const tableArrayObject = await PostService.getALL()
            setData(tableArrayObject);
            setLoading(false)
        }

        getResponse();

    }, [])


    const [data, setData] = useState([])
    const [usersDataObject, setUsersDataObject] = useState([])


    //TODO: заполнить массив нормально
    // const trueArrayDays = [
    //     '2021-05-01', '2021-05-02', '2021-05-03', '2021-05-04', '2021-05-05', '2021-05-06', '2021-05-07',
    //     '2021-05-08', '2021-05-09', '2021-05-10', '2021-05-11', '2021-05-12', '2021-05-13', '2021-05-14', '2021-05-15',
    //     '2021-05-16', '2021-05-17', '2021-05-18', '2021-05-19', '2021-05-20', '2021-05-21', '2021-05-22', '2021-05-23',
    //     '2021-05-24', '2021-05-25', '2021-05-26', '2021-05-27', '2021-05-28', '2021-05-29', '2021-05-30', '2021-05-31'
    // ]
    //Заполняем массив датами для получания dataIndex и обработки users
    for(var trueArrayDays=[],dt=new Date("2021-05-01"); dt<=new Date("2021-05-31"); dt.setDate(dt.getDate()+1)){
        trueArrayDays.push(new Date(dt).toISOString().slice(0,10));
    }



    useEffect(() => {

        if (data && data?.length > 0) {

            function arrayMutation(user) {
                const newArrayDate = []
                for (let s of trueArrayDays) {
                    const found = user?.Days?.find(feature => feature?.Date === s);
                    newArrayDate.push(found || {Date: s, End: '00-00', Start: '00-00'});
                }
                return {id: user?.id, Fullname: user?.Fullname, Days: newArrayDate}
            }
            const newUsers = data.map(user => {
                return arrayMutation(user)
            })

            function getDataDuration(user) {
                //parsing the string into hours, minutes
                function getElementDuration(el) {
                    //using moment.js library
                    const res = moment.duration(el.End.replace("-", ":"))
                        .subtract(moment.duration(el.Start.replace("-", ":")));

                    return res.hours() + ":" + res.minutes();
                }

                //ArrayWithDuration возвращает обогащенныей array Days
                const arrayWithDuration = user.Days.map((elem) => {
                    return {...elem, durationMs: getElementDuration(elem)}
                })
                return {id: user?.id, Fullname: user?.Fullname, Days: arrayWithDuration}

            }

            const newUsersDuration = newUsers.map(user => {
                return getDataDuration(user)
            })

            //Get Total work time
            function getUsersDurationWithTotal(user) {
                let sum = moment.duration("00:00");
                let temp = 0;

                for (let i = 0; i < user.Days.length; i++) {
                    temp = moment.duration(user.Days[i].durationMs.replace("-", ":"))
                    sum = sum.add(temp)
                }
                let result = 24 * sum.days() + sum.hours() + ":" + sum.minutes()
                return {id: user?.id, Fullname: user?.Fullname, Days: user?.Days, Total: result}
            }
            const newUsersDurationTotal = newUsersDuration.map(user => {
                return getUsersDurationWithTotal(user)
            })

            function userArrayToObject(user) {
                let dataObjectMy = {}

                dataObjectMy = user.Days.reduce((acc, element) => {
                    return {...acc, [element.Date]: element.durationMs}
                }, {id: user?.id, Fullname: user?.Fullname, Total: user?.Total})
                return dataObjectMy
            }
            const newUsersDate = newUsersDurationTotal.map(user => {
                return userArrayToObject(user)
            })
            setUsersDataObject(newUsersDate)

        }
    }, [data])


    //Creating AntD table component
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);
    const [loading, setLoading] = useState(false)

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };
    const handleReset = (clearFilters) => {
        clearFilters();
        setSearchText('');
    };

    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => (
            <div
                style={{
                    padding: 8,
                }}
            >
                <Input
                    ref={searchInput}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{
                        marginBottom: 8,
                        display: 'block',
                    }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined/>}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => (
            <SearchOutlined
                style={{
                    color: filtered ? '#1890ff' : undefined,
                }}
            />
        ),
        onFilter: (value, record) =>
            record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
        onFilterDropdownVisibleChange: (visible) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        render: (text) =>
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{
                        backgroundColor: '#E7F7E3',
                        padding: 0,
                    }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={text ? text.toString() : ''}
                />
            ) : (
                text
            ),
    });
    const columns = [
        {
            title: 'User',
            dataIndex: 'Fullname',
            key: '2',
            fixed: 'left',
            width: 150,
            ...getColumnSearchProps('Fullname')
        },
    ];
    //make 31 days columns with hours
    let titleCount = 1;
    for (let s of trueArrayDays) {
        columns.push({
            key: s,
            title: titleCount,
            dataIndex: s,
            width: 80,
            //render: item => Object.values(item)[0],
        });
        titleCount++
    }
    columns.push(
        {
            key: 33,
            title: 'Total',
            dataIndex: 'Total',
            fixed: 'right',
            width: 120,
        })

    return (
        <div>
            <Table className={classes.tableCastom}
                   loading={loading}
                   style={{margin: '20px'}}
                   rowkey={usersDataObject.id}
                   dataSource={usersDataObject}
                   columns={columns}
                   scroll={{
                       x: 100,
                   }}
                   title={() => 'May 2021'}
                   footer={() => 'Task for Red Mad Robot'}
            />
        </div>
    );
};

export default Tables;